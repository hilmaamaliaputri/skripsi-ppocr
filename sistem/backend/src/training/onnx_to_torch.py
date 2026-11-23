"""Konverter graf ONNX statis PP-OCRv6 Tiny ke PyTorch nn.Module yang dapat di-fine-tune."""

from typing import Dict, List, Sequence
import onnx
from onnx import numpy_helper
import torch
import torch.nn as nn
import torch.nn.functional as F

DIGIT_DICT: List[str] = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."]
# Indeks token pada kamus resmi PP-OCRv6_tiny (0=blank, 14='.', 33..42='0'..'9')
PPOCRV6_TINY_DIGIT_INDICES: List[int] = [0, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 14]


class TrainableOnnxBackbone(nn.Module):
    """Membungkus seluruh node ONNX pra-Softmax menjadi modul PyTorch terdiferensiasi."""

    def __init__(self, onnx_path: str):
        super().__init__()
        model = onnx.load(onnx_path)
        self.nodes = list(model.graph.node)
        self.input_name = model.graph.input[0].name
        self.head_weight_name = "linear_1.w_0"
        self.head_bias_name = "linear_1.b_0"
        self._safe_map: Dict[str, str] = {}
        self._node_attrs: Dict[int, Dict] = {}

        inits = {init.name: numpy_helper.to_array(init) for init in model.graph.initializer}
        bn_stat_names = {
            name
            for n in self.nodes
            if n.op_type == "BatchNormalization"
            for name in n.input[3:5]
        }

        for orig_name, arr in inits.items():
            if orig_name in (self.head_weight_name, self.head_bias_name):
                continue
            t = torch.from_numpy(arr.copy())
            safe = "p_" + orig_name.replace(".", "__")
            self._safe_map[orig_name] = safe
            if t.is_floating_point() and orig_name not in bn_stat_names:
                self.register_parameter(safe, nn.Parameter(t))
            else:
                self.register_buffer(safe, t)

        # Inisialisasi kepala CTC 12-kelas langsung dari irisan bobot pretrained 0-9, '.'
        w_full = torch.from_numpy(inits[self.head_weight_name].copy())  # (80, 6906)
        b_full = torch.from_numpy(inits[self.head_bias_name].copy())    # (6906,)
        self.head_weight = nn.Parameter(w_full[:, PPOCRV6_TINY_DIGIT_INDICES].clone())
        self.head_bias = nn.Parameter(b_full[PPOCRV6_TINY_DIGIT_INDICES].clone())

        for idx, n in enumerate(self.nodes):
            attrs = {}
            for a in n.attribute:
                if a.type == onnx.AttributeProto.INT:
                    attrs[a.name] = int(a.i)
                elif a.type == onnx.AttributeProto.FLOAT:
                    attrs[a.name] = float(a.f)
                elif a.type == onnx.AttributeProto.INTS:
                    attrs[a.name] = [int(v) for v in a.ints]
            self._node_attrs[idx] = attrs

    def _get(self, env: dict, name: str):
        if name == self.head_weight_name:
            return self.head_weight
        if name == self.head_bias_name:
            return self.head_bias
        if name in self._safe_map:
            return getattr(self, self._safe_map[name])
        return env[name]

    def forward(self, x: torch.Tensor, return_probs: bool = False) -> torch.Tensor:
        """Menghasilkan log_probs/logits berdimensi (B, T, 12) atau probabilitas Softmax."""
        env = {self.input_name: x}
        for idx, n in enumerate(self.nodes):
            op, attrs = n.op_type, self._node_attrs[idx]
            ins = [self._get(env, i) for i in n.input]
            if op == "Conv":
                pads = attrs.get("pads", [0, 0, 0, 0])
                out = F.conv2d(
                    ins[0], ins[1], ins[2] if len(ins) > 2 else None,
                    stride=tuple(attrs.get("strides", [1, 1])),
                    padding=(pads[0], pads[1]),
                    dilation=tuple(attrs.get("dilations", [1, 1])),
                    groups=attrs.get("group", 1),
                )
            elif op == "BatchNormalization":
                mom = 1.0 - attrs.get("momentum", 0.9)
                out = F.batch_norm(ins[0], ins[3], ins[4], ins[1], ins[2], training=self.training, momentum=mom, eps=attrs.get("epsilon", 1e-5))
            elif op == "Relu":
                out = F.relu(ins[0])
            elif op == "Erf":
                out = torch.erf(ins[0])
            elif op == "HardSigmoid":
                out = torch.clamp(attrs.get("alpha", 1.0 / 6.0) * ins[0] + attrs.get("beta", 0.5), 0.0, 1.0)
            elif op == "AveragePool":
                pads = attrs.get("pads", [0, 0, 0, 0])
                out = F.avg_pool2d(ins[0], kernel_size=tuple(attrs["kernel_shape"]), stride=tuple(attrs["strides"]), padding=(pads[0], pads[1]))
            elif op == "ReduceMean":
                out = torch.mean(ins[0], dim=tuple(attrs.get("axes", [])), keepdim=bool(attrs.get("keepdims", 1)))
            elif op == "Add":
                out = ins[0] + ins[1]
            elif op == "Mul":
                out = ins[0] * ins[1]
            elif op == "Div":
                out = ins[0] / ins[1]
            elif op == "Squeeze":
                out = ins[0]
                for ax in sorted(attrs.get("axes", []), reverse=True):
                    out = out.squeeze(ax)
            elif op == "Unsqueeze":
                out = ins[0]
                for ax in sorted(attrs.get("axes", [])):
                    out = out.unsqueeze(ax)
            elif op == "Transpose":
                perm = attrs.get("perm")
                out = ins[0].permute(*perm) if perm else ins[0]
            elif op == "MatMul":
                out = torch.matmul(ins[0], ins[1])
            elif op == "Identity":
                out = ins[0]
            elif op == "Softmax":
                return F.softmax(ins[0], dim=attrs.get("axis", -1)) if return_probs else ins[0]
            else:
                raise NotImplementedError(f"ONNX op tidak didukung: {op}")
            env[n.output[0]] = out
        raise RuntimeError("Softmax output node tidak ditemukan dalam graf ONNX")
