class NodeIdUtil {

    /**
     * Converts the provided hex id to a numeric id, for example: !FFFFFFFF to 4294967295
     * Anything else will be converted as is to a BigInt, for example "4294967295" to 4294967295
     * @param hexIdOrNumber a node id in hex format with a prepended "!", or a numeric node id as a string or number
     * @returns {bigint} the node id in numeric form
     */
    static convertToNumeric(hexIdOrNumber) {

        // check if this is a hex id, and convert to numeric
        if(hexIdOrNumber.toString().startsWith("!")){
            return BigInt('0x' + hexIdOrNumber.replaceAll("!", ""));
        }

        // convert string or number to numeric
        return BigInt(hexIdOrNumber);

    }

}

module.exports = NodeIdUtil;
