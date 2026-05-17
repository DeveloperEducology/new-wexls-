
/**
 * Place Values Theory and Data
 */

export const getPlaceValueTheory = (number) => {
    const digits = number.toString().split('').reverse();
    const names = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands', 'millions'];
    
    const breakdown = digits.map((digit, index) => ({
        digit: parseInt(digit),
        place: names[index],
        value: parseInt(digit) * Math.pow(10, index)
    })).reverse();

    return {
        number,
        breakdown,
        expandedForm: breakdown.filter(b => b.digit > 0).map(b => b.value).join(' + '),
        wordForm: numberToWords(number)
    };
};

function numberToWords(num) {
    if (num === 0) return 'zero';
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

    const convert = (n) => {
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
        return '';
    };

    if (num < 1000) return convert(num);
    
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return convert(thousands) + ' thousand' + (remainder !== 0 ? (remainder < 100 ? ' and ' : ' ') + convert(remainder) : '');
}
