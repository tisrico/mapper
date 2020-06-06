/*
 * MIB attribute implementation for VLAN tagging behaviour parsing.
 */
export class MibAttrUtil {
    static hexToBytes(hex) {
        let bytes = [];
        for (let c = 0; c < hex.length; c += 2) {
            bytes.push(parseInt(hex.substr(c, 2), 16));
        }
        return bytes;
    }

    static getWordBit(byte_buf, word_byte_len, word, bit_start, bit_end) {
        if (!(byte_buf instanceof Array))
            return null;

        if (word < 0 || word >= Math.floor(byte_buf.length / word_byte_len))
            return null;

        if (bit_start > bit_end || bit_start < 0 || bit_end < 0)
            return null;

        let max_bit = word_byte_len * 8 - 1;
        if (bit_start > max_bit || bit_end > max_bit)
            return null;

        let result = 0;
        let base = word * word_byte_len;
        let j = 0;

        for (let i = bit_start, j = 1; i <= bit_end; i++, j <<= 1) {
            let mask = 1 << (i % 8);
            let byte_idx = base + ((word_byte_len - 1) - Math.floor(i / 8));

            if (byte_buf[byte_idx] == null)
                return null;

            result |= byte_buf[byte_idx] & mask ? j : 0;
        }

        return result;
    }

    static get4ByteWordBit(byte_buf, word, bit_start, bit_end) {
        return MibAttrUtil.getWordBit(byte_buf, 4, word, bit_start, bit_end);
    }

    static attachText(orig_str, new_text) {
        return orig_str + new_text;
    }

    static attachNewLine(orig_str, new_line) {
        if (orig_str === "")
            return new_line;
        else
            return orig_str + "\n" + new_line;
    }

    static htmlEntities(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}

// Filter priority definition
const OMCI_FILTER_PRIO_MIN         = 0;
const OMCI_FILTER_PRIO_MAX         = 7;
const OMCI_FILTER_PRIO_NONE        = 8;
const OMCI_FILTER_PRIO_DEFAULT     = 14;
const OMCI_FILTER_IGNORE           = 15;

// Filter VLANID definition
const OMCI_FILTER_VLANID_MIN       = 0;
const OMCI_FILTER_VLANID_MAX       = 4094;
const OMCI_FILTER_VLANID_NONE      = 4096;

// Filter TPID/DEI definition
const OMCI_FILTER_TPID_DE_NONE     = 0;
const OMCI_FILTER_TPID_8100_DE_X   = 4;
const OMCI_FILTER_TPID_INPUT_DE_X  = 5;
const OMCI_FILTER_TPID_INPUT_DE_0  = 6;
const OMCI_FILTER_TPID_INPUT_DE_1  = 7;

const FILTER_NAMES_TPID_DEI = [
    "-",
    "Reserved (1)",
    "Reserved (2)",
    "Reserved (3)",
    "TPID=0x8100",
    "TPID=input",
    "TPID=input, DEI=0",
    "TPID=input, DEI=1"
];

// Filter Ethertype definition
const OMCI_FILTER_ETHER_NONE       = 0;
const OMCI_FILTER_ETHER_IPOE       = 1;
const OMCI_FILTER_ETHER_PPPOE      = 2; /* add etherType = 0x8863 */
const OMCI_FILTER_ETHER_ARP        = 3;
const OMCI_FILTER_ETHER_IPV6       = 4;
const OMCI_FILTER_ETHER_PPPOE_2    = 5; /* ETHER_PPPOE needs to add 0x8863 and 0x8864,
                                           create PPPOE_2 to add etherType = 0x8864 */

const FILTER_NAMES_ETHTYPE = [
    "-",
    "0x0800 (IPOE)",
    "0x8863 (PPPOE)",
    "0x0806 (ARP)",
    "0x86DD (IPv6)",
    "0x8864 (PPPOE_2)",
];

// VLAN tag treatment removal type
const OMCI_TREATMENT_REMOVE_NONE    = 0;
const OMCI_TREATMENT_REMOVE_OUTER   = 1;
const OMCI_TREATMENT_REMOVE_BOTH    = 2;
const OMCI_TREATMENT_DISCARD_FRAME  = 3;

const TREATMENT_NAMES_TAG_REMOVE = [
    "no remove",
    "remove outer",
    "remove both",
    "discard frame",
];

// Treatment priority definition
const OMCI_TREATMENT_PRIO_MIN                 = 0;
const OMCI_TREATMENT_PRIO_MAX                 = 7;
const OMCI_TREATMENT_PRIO_COPY_FROM_INNER     = 8;
const OMCI_TREATMENT_PRIO_COPY_FROM_OUTER     = 9;
const OMCI_TREATMENT_PRIO_DERIVE_FROM_DSCP    = 10;
const OMCI_TREATMENT_PRIO_DONT_ADD            = 15;

const TREATMENT_NAMES_PRIO = [
    "copy from inner",
    "copy from outer",
    "DSCP",
    "Reserved (11)",
    "Reserved (12)",
    "Reserved (13)",
    "Reserved (14)",
    "do not add",
];

// Treatment VLANID definition
const OMCI_TREATMENT_VLANID_MIN               = 0;
const OMCI_TREATMENT_VLANID_MAX               = 4094;
const OMCI_TREATMENT_VLANID_COPY_FROM_INNER   = 4096;
const OMCI_TREATMENT_VLANID_COPY_FROM_OUTER   = 4097;

const TREATMENT_NAMES_VID = [
    "copy from inner",
    "copy from outer",
];

const TREATMENT_NAMES_TPID_DEI = [
    "copy TPID/DEI from inner",
    "copy TPID/DEI from outer",
    "TPID=output, DEI=copy from inner",
    "TPID=output, DEI=copy from outer",
    "TPDI=0x8100",
    "Reserved (5)",
    "TPID=output, DEI=0",
    "TPID=output, DEI=1",
];

export class MibAttrVlanTaggingBehaviour {
    constructor(filter_outer_prio, filter_outer_vid, filter_outer_tpid_dei,
                filter_inner_prio, filter_inner_vid, filter_inner_tpid_dei,
                filter_eth_type, treatment_tags_to_remove,
                treatment_outer_prio, treatment_outer_vid, treatment_outer_tpid_dei,
                treatment_inner_prio, treatment_inner_vid, treatment_inner_tpid_dei) {
        this.filter_outer_prio = filter_outer_prio;
        this.filter_outer_vid = filter_outer_vid;
        this.filter_outer_tpid_dei = filter_outer_tpid_dei;
        this.filter_inner_prio = filter_inner_prio;
        this.filter_inner_vid = filter_inner_vid;
        this.filter_inner_tpid_dei = filter_inner_tpid_dei;
        this.filter_eth_type = filter_eth_type;
        this.treatment_tags_to_remove = treatment_tags_to_remove;
        this.treatment_outer_prio = treatment_outer_prio;
        this.treatment_outer_vid = treatment_outer_vid;
        this.treatment_outer_tpid_dei = treatment_outer_tpid_dei;
        this.treatment_inner_prio = treatment_inner_prio;
        this.treatment_inner_vid = treatment_inner_vid;
        this.treatment_inner_tpid_dei = treatment_inner_tpid_dei;

        if (filter_outer_prio !== OMCI_FILTER_IGNORE &&
            filter_inner_prio !== OMCI_FILTER_IGNORE) {
            this.tag_count = 2;
        } else if (filter_inner_prio !== OMCI_FILTER_IGNORE) {
            this.tag_count = 1;
        } else {
            this.tag_count = 0;
        }
    }

    dump() {
        let text = "<" + this.tag_count + "-tag>";

        if (this.filter_outer_prio !== OMCI_FILTER_IGNORE) {
            if (this.filter_outer_prio >= OMCI_FILTER_PRIO_MIN &&
                this.filter_outer_prio <= OMCI_FILTER_PRIO_MAX)
                text = MibAttrUtil.attachNewLine(text, "<Filter><outer> Priority: " + this.filter_outer_prio);
            else if (this.filter_outer_prio === OMCI_FILTER_PRIO_DEFAULT)
                text = MibAttrUtil.attachNewLine(text, "<Default 2-tag rule>");
            if (this.filter_outer_vid !== OMCI_FILTER_VLANID_NONE)
                text = MibAttrUtil.attachNewLine(text, "<Filter><outer> VID: " + this.filter_outer_vid);
            if (this.filter_outer_tpid_dei !== OMCI_FILTER_TPID_DE_NONE) {
                text = MibAttrUtil.attachNewLine(text, "<Filter><outer> TPID/DEI: " +
                    FILTER_NAMES_TPID_DEI[this.filter_outer_tpid_dei] + " (" + this.filter_outer_tpid_dei + ")");
            }
        }
        if (this.filter_inner_prio !== OMCI_FILTER_IGNORE) {
            if (this.filter_inner_prio >= OMCI_FILTER_PRIO_MIN &&
                this.filter_inner_prio <= OMCI_FILTER_PRIO_MAX)
                text = MibAttrUtil.attachNewLine(text, "<Filter><inner> Priority: " + this.filter_inner_prio);
            else if (this.filter_inner_prio === OMCI_FILTER_PRIO_DEFAULT)
                text = MibAttrUtil.attachNewLine(text, "<Default 1-tag rule>");
            if (this.filter_inner_vid !== OMCI_FILTER_VLANID_NONE)
                text = MibAttrUtil.attachNewLine(text, "<Filter><inner> VID: " + this.filter_inner_vid);
            if (this.filter_inner_tpid_dei !== OMCI_FILTER_TPID_DE_NONE)
                text = MibAttrUtil.attachNewLine(text, "<Filter><inner> TPID/DEI: " +
                    FILTER_NAMES_TPID_DEI[this.filter_inner_tpid_dei] + " (" + this.filter_inner_tpid_dei + ")");
        }

        if (this.filter_eth_type !== OMCI_FILTER_ETHER_NONE) {
            text = MibAttrUtil.attachNewLine(text, "<Filter> Ethertype: " +
                FILTER_NAMES_ETHTYPE[this.filter_eth_type] + " (0x" + this.filter_eth_type.toString(16) + ")");
        }

        if (this.treatment_tags_to_remove !== OMCI_TREATMENT_REMOVE_NONE) {
            text = MibAttrUtil.attachNewLine(text, "<Treatment> Tag treatment: " +
                TREATMENT_NAMES_TAG_REMOVE[this.treatment_tags_to_remove] + " (" + this.treatment_tags_to_remove + ")");
        }

        if (this.treatment_outer_prio !== OMCI_TREATMENT_PRIO_DONT_ADD) {
            text = MibAttrUtil.attachNewLine(text, "<Treatment><outer> Priority: " +
                (this.treatment_outer_prio <= OMCI_TREATMENT_PRIO_MAX ?
                this.treatment_outer_prio : TREATMENT_NAMES_PRIO[this.treatment_outer_prio - OMCI_TREATMENT_PRIO_MAX - 1]));
            text = MibAttrUtil.attachNewLine(text, "<Treatment><outer> VID: " +
                (this.treatment_outer_vid < OMCI_TREATMENT_VLANID_COPY_FROM_INNER ?
                this.treatment_outer_vid : TREATMENT_NAMES_VID[this.treatment_outer_vid - OMCI_TREATMENT_VLANID_COPY_FROM_INNER]));
            text = MibAttrUtil.attachNewLine(text, "<Treatment><outer> TPID/DEI: " +
                TREATMENT_NAMES_TPID_DEI[this.treatment_outer_tpid_dei] + " (" + this.treatment_outer_tpid_dei + ")");
        }

        if (this.treatment_inner_prio !== OMCI_TREATMENT_PRIO_DONT_ADD) {
            text = MibAttrUtil.attachNewLine(text, "<Treatment><inner> Priority: " +
                (this.treatment_inner_prio <= OMCI_TREATMENT_PRIO_MAX ?
                this.treatment_inner_prio : TREATMENT_NAMES_PRIO[this.treatment_inner_prio - OMCI_TREATMENT_PRIO_MAX - 1]));
            text = MibAttrUtil.attachNewLine(text, "<Treatment><inner> VID: " +
                (this.treatment_inner_vid < OMCI_TREATMENT_VLANID_COPY_FROM_INNER ?
                this.treatment_inner_vid : TREATMENT_NAMES_VID[this.treatment_inner_vid - OMCI_TREATMENT_VLANID_COPY_FROM_INNER]));
            text = MibAttrUtil.attachNewLine(text, "<Treatment><inner> TPID/DEI: " +
                TREATMENT_NAMES_TPID_DEI[this.treatment_inner_tpid_dei] + " (" + this.treatment_inner_tpid_dei + ")");
        }

        return text;
    }

    static parse(content) {
        let bytes = MibAttrUtil.hexToBytes(content);

        // For word and bit info please refer to G.988 page 131.
        // In G.988 it is word 1~4 but here we use word 0~3
        let filter_outer_prio = MibAttrUtil.get4ByteWordBit(bytes, 0, 28, 31);
        let filter_outer_vid = MibAttrUtil.get4ByteWordBit(bytes, 0, 15, 27);
        let filter_outer_tpid_dei = MibAttrUtil.get4ByteWordBit(bytes, 0, 12, 14);

        let filter_inner_prio = MibAttrUtil.get4ByteWordBit(bytes, 1, 28, 31);
        let filter_inner_vid = MibAttrUtil.get4ByteWordBit(bytes, 1, 15, 27);
        let filter_inner_tpid_dei = MibAttrUtil.get4ByteWordBit(bytes, 1, 12, 14);

        let filter_eth_type = MibAttrUtil.get4ByteWordBit(bytes, 1, 0, 3);

        let treatment_tags_to_remove = MibAttrUtil.get4ByteWordBit(bytes, 2, 30, 31);

        let treatment_outer_prio = MibAttrUtil.get4ByteWordBit(bytes, 2, 16, 19);
        let treatment_outer_vid = MibAttrUtil.get4ByteWordBit(bytes, 2, 3, 15);
        let treatment_outer_tpid_dei = MibAttrUtil.get4ByteWordBit(bytes, 2, 0, 2);

        let treatment_inner_prio = MibAttrUtil.get4ByteWordBit(bytes, 3, 16, 19);
        let treatment_inner_vid = MibAttrUtil.get4ByteWordBit(bytes, 3, 3, 15);
        let treatment_inner_tpid_dei = MibAttrUtil.get4ByteWordBit(bytes, 3, 0, 2);

        if (filter_outer_prio == null ||
                filter_outer_vid == null ||
                filter_outer_tpid_dei == null ||
                filter_inner_prio == null ||
                filter_inner_vid == null ||
                filter_inner_tpid_dei == null ||
                filter_eth_type == null ||
                treatment_tags_to_remove == null ||
                treatment_outer_prio == null ||
                treatment_outer_vid == null ||
                treatment_outer_tpid_dei == null ||
                treatment_inner_prio == null ||
                treatment_inner_vid == null ||
                treatment_inner_tpid_dei == null) {
            return null;
        }
        else {
            return new MibAttrVlanTaggingBehaviour(
                filter_outer_prio, filter_outer_vid, filter_outer_tpid_dei,
                filter_inner_prio, filter_inner_vid, filter_inner_tpid_dei,
                filter_eth_type, treatment_tags_to_remove,
                treatment_outer_prio, treatment_outer_vid, treatment_outer_tpid_dei,
                treatment_inner_prio, treatment_inner_vid, treatment_inner_tpid_dei);
        }
    }
}

const DOWNSTREAM_MODE = [
    "0 INVERSE",
    "1 TRANSPARENT",
    "2 FILTER_VLAN_PBIT_INVERSE_OR_FORWARD",
    "3 FILTER_VLAN_INVERSE_OR_FORWARD",
    "4 FILTER_PBIT_INVERSE_OR_FORWARD",
    "5 FILTER_VLAN_PBIT_INVERSE_OR_DROP",
    "6 FILTER_VLAN_INVERSE_OR_DROP",
    "7 FILTER_PBIT_INVERSE_OR_DROP",
    "8 DROP",
];

export class MibAttrExtVlanDsMode {
    constructor(mode) {
        this.mode = mode
    }

    dump() {
        if (!(this.mode >= 0 && this.mode <= 8))
            return "<invalid>";
        return DOWNSTREAM_MODE[this.mode];
    }

    static parse(content) {
        let mode = parseInt(content);
        if (!(mode >= 0 && mode <= 8))
            return null;

        return new MibAttrExtVlanDsMode(mode);
    }
}

export class MibAttrVlanFilterList {
    constructor(vlan_list) {
        this.vlan_list = vlan_list
    }

    dump() {
        if (this.vlan_list == null || this.vlan_list.length === 0)
            return "<Empty>";

        let text = "";
        for (let i = 0; i < this.vlan_list.length; i++) {
            let vid = this.vlan_list[i] & 0x0FFF;
            let cfi = (this.vlan_list[i] >> 12) & 0x1;
            let pbit = this.vlan_list[i] >> 13;
            let prefix = ('0000' + this.vlan_list[i].toString(16)).slice(-4);
            text = MibAttrUtil.attachNewLine(text, "0x" + prefix + ": VID " + vid + ", PBIT " + pbit + ", CFI " + cfi);
        }

        return text;
    }

    static parse(content) {
        let bytes = MibAttrUtil.hexToBytes(content);
        if (bytes == null)
            return null;

        let vlan_list = [];
        for (let i = 0; i < bytes.length; i += 2) {
            if (bytes[i] !== 0 || bytes[i+1] !== 0)
                vlan_list.push(((bytes[i] << 8) | bytes[i+1]));
        }

        return new MibAttrVlanFilterList(vlan_list);
    }
}

const FORWARD_OPTION = [
    ["0x00", "Bridging (a) (no investigation)",    "Bridging (a)"],
    ["0x01", "Discarding (c)",                     "Bridging (a)"],
    ["0x02", "Bridging (a) (no investigation)",    "Discarding (c)"],
    ["0x03", "Action (h) (VID investigation)",     "Bridging (a)"],
    ["0x04", "Action (h) (VID investigation)",     "Discarding (c)"],
    ["0x05", "Action (g) (VID investigation)",     "Bridging (a)"],
    ["0x06", "Action (g) (VID investigation)",     "Discarding (c)"],
    ["0x07", "Action (h) (user priority investigation)",   "Bridging (a)"],
    ["0x08", "Action (h) (user priority investigation)",   "Discarding (c)"],
    ["0x09", "Action (g) (user priority investigation)",   "Bridging (a)"],
    ["0x0A", "Action (g) (user priority investigation)",   "Discarding (c)"],
    ["0x0B", "Action (h) (TCI investigation)",     "Bridging (a)"],
    ["0x0C", "Action (h) (TCI investigation)",     "Discarding (c)"],
    ["0x0D", "Action (g) (TCI investigation)",     "Bridging (a)"],
    ["0x0E", "Action (g) (TCI investigation)",     "Discarding (c)"],
    ["0x0F", "Action (h) (VID investigation)",     "Bridging (a)"],
    ["0x10", "Action (h) (VID investigation)",     "Discarding (c)"],
    ["0x11", "Action (h) (user priority investigation)",   "Bridging (a)"],
    ["0x12", "Action (h) (user priority investigation)",   "Discarding (c)"],
    ["0x13", "Action (h) (TCI investigation)",     "Bridging (a)"],
    ["0x14", "Action (h) (TCI investigation)",     "Discarding (c)"],
    ["0x15", "Bridging (a) (no investigation)",    "Discarding (c)"],
    ["0x16", "Action (j) (VID investigation)",     "Bridging (a)"],
    ["0x17", "Action (j) (VID investigation)",     "Discarding (c)"],
    ["0x18", "Action (j) (user priority investigation)",   "Bridging (a)"],
    ["0x19", "Action (j) (user priority investigation)",   "Discarding (c)"],
    ["0x1A", "Action (j) (TCI investigation)",     "Bridging (a)"],
    ["0x1B", "Action (j) (TCI investigation)",     "Discarding (c)"],
    ["0x1C", "Action (h) (VID investigation)",     "Bridging (a)"],
    ["0x1D", "Action (h) (VID investigation)",     "Discarding (c)"],
    ["0x1E", "Action (h) (user priority investigation)",   "Bridging (a)"],
    ["0x1F", "Action (h) (user priority investigation)",   "Discarding (c)"],
    ["0x20", "Action (h) (TCI investigation)",     "Bridging (a)"],
    ["0x21", "Action (h) (TCI investigation)",     "Discarding (c)"],
];

const FORWARD_OPTION_ACTION = [
    ["(a)", "Bridging (a) Basic MAC bridge operation"],
    ["(c)", "Discarding (c) Unconditional discarding"],
    ["(g)", "Action (g) Negative filtering by TCI"],
    ["(h)", "Action (h) Bidirectional positive filtering by TCI"],
    ["(j)", "Action (j) Positive filtering by TCI and DA"],
];

export class MibAttrForwardOption {
    constructor(mode) {
        this.mode = mode
    }

    dump() {
        if (!(this.mode >= 0 && this.mode <= 0x21))
            return "<invalid>";

        let text = "";
        text = MibAttrUtil.attachNewLine(text, "Mode: " + FORWARD_OPTION[this.mode][0]);

        for (let k = 1; k <= 2; k++) {
            let prefix = k === 1 ? "Tagged: " : "Untagged: ";
            text = MibAttrUtil.attachNewLine(text, prefix + FORWARD_OPTION[this.mode][k]);
            for(let i = 0; i < FORWARD_OPTION_ACTION.length; i++) {
                if (FORWARD_OPTION[this.mode][k].indexOf(FORWARD_OPTION_ACTION[i][0]) >= 0) {
                    text = MibAttrUtil.attachNewLine(text,  prefix + FORWARD_OPTION_ACTION[i][1]);
                    break;
                }
            }
        }

        return text;
    }

    static parse(content) {
        let mode = parseInt(content);
        if (!(mode >= 0 && mode <= 0x21))
            return null;

        return new MibAttrForwardOption(mode);
    }
}