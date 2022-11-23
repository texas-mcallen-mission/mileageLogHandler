

/**
 *  An index of kiDataEntries that's ordered by a key.  This is used to figure out where something should be inserted in the sheets.1  
 *
 * @interface positionalIndex
 */
interface positionalIndex {
    [index: number]: kiDataEntry;
}



function convertKisToSlideEntries(entries: kiDataEntry[]): slideDataEntry[] {
    let outData: slideDataEntry[] = [];
    for (let entry of entries) {
        outData.push(convertKiToSlide(entry));
    }
    return outData;
}
function convertKiToSlide(entry: kiDataEntry) {
    let outEntry: slideDataEntry = {
        gasCard: 0,
        logPageIdList: '',
        receiptPageIdList: '',
        month: '',
        year: '',
        logPageIdArray: [],
        receiptPageIdArray: [],
        startPosition:0,
    };
    for (let key in outEntry) {
        if (entry.hasOwnProperty(key)) {
            outEntry[key] = entry[key];
        }
    }
    let receipts: string[] = outEntry.receiptPageIdList.trim().split(",");
    let logPhotos: string[] = outEntry.logPageIdList.trim().split(",");
    return outEntry;
}

interface log_data extends kiDataEntry {
    timestamp: string,
    area_name: string,
    email: string,
    report_month: string,
    report_year: string | number,
    pulled: boolean | "" | null,
    car_year: number,
    car_make: string,
    car_model: string,
    car_lpn: string,
    car_vin_five: string | number,
    card_number: string,
    odo_start: number,
    odo_end: number,
    mile_sum: number,
    gas_pics: string,
    log_pics: string,
}

interface folderReturn {
    id: string,
    folder: GoogleAppsScript.Drive.Folder;
}


interface logResponseEntry extends kiDataEntry {
    timestamp: string,
    area_name: string,
    email: string,
    report_month: string,
    report_year: string | number,
    pulled: boolean,
    car_year: string | number,
    car_make: string,
    car_model: string,
    car_lpn: string,
    car_vin_five: string | number,
    card_number: string | number,
    odo_start: number,
    odo_end: number,
    mile_sum: number,
    has_forgiveness: boolean | null,
    qty_forgiveness: boolean | null,
    forgive_types: string,
    rp_1: string,
    rc_1: number,
    rp_2: string | null,
    rc_2: number | null,
    rp_3: string | null,
    rc_3: number | null,
    rp_4: string | null,
    rc_4: number | null,
    rp_5: string | null,
    rc_5: number | null,
    rp_6: string | null,
    rc_6: number | null,
    rp_7: string | null,
    rc_7: number | null,
    rp_8: string | null,
    rc_8: number | null,
    rp_9: string | null,
    rc_9: number | null,
    rp_10: string | null,
    rc_10: number | null,
    rp_11: string | null,
    rc_11: number | null,
    rp_12: string | null,
    rc_12: number | null,
    gas_pics: string | null,
    log_pics: string | null,
    stored_gas_pics: string | null,
    stored_log_pics: string | null
}

function convertKiEntriesToLogResponses(entries: kiDataEntry[]): logResponseEntry[] {
    let outData: logResponseEntry[] = []

    for (let entry of entries) {
        outData.push(convertKiEntryToLogResponse(entry))
    }
    return outData
}

function convertKiEntryToLogResponse(entry: kiDataEntry): logResponseEntry {
    let outData: logResponseEntry = {
        timestamp: '',
        area_name: '',
        email: '',
        report_month: '',
        report_year: '',
        pulled: false,
        car_year: '',
        car_make: '',
        car_model: '',
        car_lpn: '',
        car_vin_five: '',
        card_number: '',
        odo_start: 0,
        odo_end: 0,
        mile_sum: 0,
        has_forgiveness: null,
        qty_forgiveness: null,
        forgive_types: '',
        rp_1: '',
        rc_1: 0,
        rp_2: null,
        rc_2: null,
        rp_3: null,
        rc_3: null,
        rp_4: null,
        rc_4: null,
        rp_5: null,
        rc_5: null,
        rp_6: null,
        rc_6: null,
        rp_7: null,
        rc_7: null,
        rp_8: null,
        rc_8: null,
        rp_9: null,
        rc_9: null,
        rp_10: null,
        rc_10: null,
        rp_11: null,
        rc_11: null,
        rp_12: null,
        rc_12: null,
        gas_pics: null,
        log_pics: null,
        stored_gas_pics: null,
        stored_log_pics: null,
    };
    for (let key in outData) {
        if (entry.hasOwnProperty(key)) {
            outData[key] = entry[key];
        }
        if (key == "has_forgiveness") {
            if (String(entry[key]).toLowerCase() == "yes") {
                outData[key] = true;
            } else {
                outData[key] = false
            }
        }
    }
    return outData;
}

interface slideDataEntry extends kiDataEntry {
    gasCard: number,
    startPosition:number,
    logPageIdList: string,
    receiptPageIdList: string,
    month: string,
    year: string | number,
    logPageIdArray: string[],
    receiptPageIdArray: string[],
}