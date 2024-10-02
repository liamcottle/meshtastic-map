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

test('can set integer position precision to provided bits', () => {

    // these tests are using the auckland sky tower position
    // auckland sky tower: -36.84844007222091, 174.76221115261924
    // the outputs we are expecting, are the same values returned by the code in the meshtastic firmware
    // https://github.com/meshtastic/firmware/blob/0a93261c0646f93aea518cc0599e547e9dc0e997/src/modules/PositionModule.cpp#L187

    // set precision to 32 bits (within 0 meters)
    // -36.8484400, 174.7622111 -> -36.8484400, 174.7622111
    expect(PositionUtil.setPositionPrecision(-368484400, 32)).toBe(-368484400);
    expect(PositionUtil.setPositionPrecision(1747622111, 32)).toBe(1747622111);

    // set precision to 16 bits (within ~364 meters)
    // -36.8484400, 174.7622111 -> -36.8476160, 174.7615744
    expect(PositionUtil.setPositionPrecision(-368484400, 16)).toBe(-368476160);
    expect(PositionUtil.setPositionPrecision(1747622111, 16)).toBe(1747615744);

    // set precision to 13 bits (within ~2.9 kilometers)
    // -36.8484400, 174.7622111 -> -36.8312320, 174.7714048
    expect(PositionUtil.setPositionPrecision(-368484400, 13)).toBe(-368312320);
    expect(PositionUtil.setPositionPrecision(1747622111, 13)).toBe(1747714048);

    // set precision to 11 bits (within ~11.6 kilometers)
    // -36.8484400, 174.7622111 -> -36.8050176, 174.7976192
    expect(PositionUtil.setPositionPrecision(-368484400, 11)).toBe(-368050176);
    expect(PositionUtil.setPositionPrecision(1747622111, 11)).toBe(1747976192);

});
