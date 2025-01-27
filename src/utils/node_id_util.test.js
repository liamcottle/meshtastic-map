const NodeIdUtil = require("./node_id_util");

test('can convert hex id to numeric id', () => {
    expect(NodeIdUtil.convertToNumeric("!FFFFFFFF")).toBe(BigInt(4294967295));
});

test('can convert numeric id to numeric id', () => {
    expect(NodeIdUtil.convertToNumeric(4294967295)).toBe(BigInt(4294967295));
});
