const PositionUtil = require("./position_util");

test('can truncate string position to provided decimal places', () => {
    expect(PositionUtil.truncateDecimalPlaces("12.3456789", 0)).toBe("12");
    expect(PositionUtil.truncateDecimalPlaces("12.3456789", 1)).toBe("12.3");
    expect(PositionUtil.truncateDecimalPlaces("12.3456789", 2)).toBe("12.34");
    expect(PositionUtil.truncateDecimalPlaces("12.3456789", 3)).toBe("12.345");
    expect(PositionUtil.truncateDecimalPlaces("12.3456789", 4)).toBe("12.3456");
    expect(PositionUtil.truncateDecimalPlaces("12.3456789", 5)).toBe("12.34567");
    expect(PositionUtil.truncateDecimalPlaces("12.3456789", 6)).toBe("12.345678");
    expect(PositionUtil.truncateDecimalPlaces("12.3456789", 7)).toBe("12.3456789");
    expect(PositionUtil.truncateDecimalPlaces("12.3", 7)).toBe("12.3");
    expect(PositionUtil.truncateDecimalPlaces(null, 2)).toBe(null);
    expect(PositionUtil.truncateDecimalPlaces("", 2)).toBe("");
    expect(PositionUtil.truncateDecimalPlaces("12", 2)).toBe("12");
    expect(PositionUtil.truncateDecimalPlaces("123", 2)).toBe("123");
    expect(PositionUtil.truncateDecimalPlaces("1234.", 2)).toBe("1234");
});
