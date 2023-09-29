

export default class QueryValidator {
    public validateWhere(filter: Filter): void {
        if (!filter) return;

        const filterKeys = Object.keys(filter);

        if (filterKeys.length !== 1) {
            throw new InsightError('Each filter should be exactly one key');
        }

        const key = filterKeys[0];
        if (key === 'AND' || key === 'OR') {
            this.validateLogicComparison(filter as LogicComparison);
        } else if (key === 'IS') {
            this.validateSComparison(filter as SComparison);
        } else if (['LT', 'GT', 'EQ'].includes(key)) {
            this.validateMComparison(filter as MComparison);
        } else if (key === 'NOT') {
            this.validateWhere(filter[key] as Filter);
        } else {
            throw new InsightError(`Invalid key in filter: ${key}`);
        }
    }

    public validateLogicComparison(logicComparison: LogicComparison): void {
        const logicKeys = Object.keys(logicComparison);
        if (logicKeys.length !== 1) {
            throw new InsightError('LogicComparison must have exactly one key (AND or OR)');
        }
    
        const filterArray = logicComparison[logicKeys[0]];
    
        if (!Array.isArray(filterArray) || filterArray.length === 0) {
            throw new InsightError(`LogicComparison for ${logicKey} must have a non-empty array of filters`);
        }
    
        for (const filter of filterArray) {
            this.validateWhere(filter);  // recursively validate each filter in the array
        }
    
    }
    
    public validateMComparison(mComparison: MComparison): void {
        const mComparatorKeys = Object.keys(mComparison);
        const comparator = mComparatorKeys[0] as MComparator;
    
        // todo: Check that doesn't map to an array

        const fieldObject = mComparison[comparator];
        if (!fieldObject) {
            throw new InsightError(`MComparison for ${comparator} must have a value`);
        }
    
        const fieldKeys = Object.keys(fieldObject);
        if (fieldKeys.length !== 1) {
            throw new InsightError('MComparison value object must have exactly one key');
        }
    
        const fieldValue = fieldObject[fieldKeys[0]];
        if (typeof fieldValue !== 'number') {
            throw new InsightError(`Invalid value for ${fieldKeys[0]} in MComparison. Expected a number`);
        }
    }
    
    public validateSComparison(sComparison: SComparison): void {    
        // Check that IS maps to an object
        const isObject = sComparison.IS;
        if (!isObject) {
            throw new InsightError(`SComparison must have a value`);
        }
        // todo: Check that IS doesn't map to an array
        
        // Check that IS maps to an object with only 1 key
        const isKeys = Object.keys(isObject);
        if (isKeys.length !== 1) {
            throw new InsightError('IS object in SComparison must have exactly one key');
        }
    
        // Check that skey maps to an input string
        const fieldKey = isKeys[0];
        const fieldValue = isObject[fieldKey];
        if (!fieldValue) {
            throw new InsightError(`SComparison must have a skey to inputstring mapping`);
        }
    
        // Check that the skey mapped value is a string
        if (typeof fieldValue !== 'string') {
            throw new InsightError(`Invalid value for ${fieldKey} in SComparison. Expected a string`);
        }
    }
    
    

    public validateOptions(options: Options): void {
        if (!options.COLUMNS || !Array.isArray(options.COLUMNS) || options.COLUMNS.length === 0) {
            throw new InsightError('Invalid Options: Missing or empty COLUMNS array');
        }
        // Add further validation
    }
}