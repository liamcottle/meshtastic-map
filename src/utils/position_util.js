class PositionUtil {

    /**
     * Truncates the provided latitude or longitude to a maximum of x decimal places
     * e.g: 12.3456789 with 2 decimal places would be 12.34
     * @param latitudeOrLongitudeString e.g: 12.3456789
     * @param numberOfDecimalPlaces how many decimal places to allow in the result
     * @returns {*|string|null}
     */
    static truncateDecimalPlaces(latitudeOrLongitudeString, numberOfDecimalPlaces) {

        // ensure value not null
        if(latitudeOrLongitudeString == null){
            return null;
        }

        // split into left and right side of decimal point
        // e.g: -12.3456789 -> [-12, 3456789]
        var [ leftOfDecimalPoint, rightOfDecimalPoint ] = latitudeOrLongitudeString.split(".");

        // check if decimal places available
        if(rightOfDecimalPoint != null){

            // truncate decimal places to desired length
            rightOfDecimalPoint = rightOfDecimalPoint.substring(0, numberOfDecimalPlaces);

            // return modified position with decimal places, if available
            if(rightOfDecimalPoint.length > 0){
                return [ leftOfDecimalPoint, rightOfDecimalPoint ].join(".");
            }

            // no decimal places available anymore, return left side without dot
            return leftOfDecimalPoint;

        }

        // decimal places not available, return position as is
        return latitudeOrLongitudeString;

    }

}

module.exports = PositionUtil;
