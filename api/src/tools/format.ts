import { HardwareModel } from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/mesh_pb.js";
import {
  Config_DeviceConfig_Role,
  Config_LoRaConfig_RegionCode,
  Config_LoRaConfig_ModemPreset,
} from "@buf/meshtastic_protobufs.bufbuild_es/meshtastic/config_pb.js";

// appends extra info for node objects returned from api
export function formatNodeInfo(node: any) {
  return {
    ...node,
    node_id_hex: `!${node.node_id.toString(16)}`,
    hardware_model_name: HardwareModel[node.hardware_model] ?? null,
    role_name: Config_DeviceConfig_Role[node.role] ?? null,
    region_name: Config_LoRaConfig_RegionCode[node.region] ?? null,
    modem_preset_name: Config_LoRaConfig_ModemPreset[node.modem_preset] ?? null,
  };
}
