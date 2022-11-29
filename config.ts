
let config = {
    disableMarkingPulled: true,
    softCutoffInMinutes: 25,
    debug_mode: false,
};

let contactConfig: sheetDataEntry = {
    tabName: "Contact Data",
    headerRow: 0,
    includeSoftcodedColumns: true,
    initialColumnOrder: {
        dateContactGenerated: 0,
        areaEmail: 1,
        areaName: 2,
        name1: 3,
        position1: 4,
        isTrainer1: 5,
        name2: 6,
        position2: 7,
        isTrainer2: 8,
        name3: 9,
        position3: 10,
        isTrainer3: 11,
        district: 12,
        zone: 13,
        unitString: 14,
        hasMultipleUnits: 15,
        languageString: 16,
        isSeniorCouple: 17,
        isSisterArea: 18,
        hasVehicle: 19,
        vehicleMiles: 20,
        vinLast8: 21,
        aptAddress: 22,
    }
};

// make sure to update the interface in types as well!
let responseConfig: sheetDataEntry = {
    tabName: "Responses",
    headerRow: 0,
    includeSoftcodedColumns: true,
    initialColumnOrder: {
        timestamp: 0,
        area_name: 1,
        email: 2,
        report_month: 3,
        report_year: 4,
        pulled: 5,
        car_year: 6,
        car_make: 7,
        car_model: 8,
        car_lpn: 9,
        car_vin_five: 10,
        card_number: 11,
        odo_start: 12,
        odo_end: 13,
        mile_sum: 14,
        has_forgiveness: 15,
        qty_forgiveness: 16,
        forgive_types: 17,
        rp_1: 18,
        rc_1: 19,
        rp_2: 20,
        rc_2: 21,
        rp_3: 22,
        rc_3: 23,
        rp_4: 24,
        rc_4: 25,
        rp_5: 26,
        rc_5: 27,
        rp_6: 28,
        rc_6: 29,
        rp_7: 30,
        rc_7: 31,
        rp_8: 32,
        rc_8: 33,
        rp_9: 34,
        rc_9: 35,
        rp_10: 36,
        rc_10: 37,
        rp_11: 38,
        rc_11: 39,
        rp_12: 40,
        rc_12: 41,
        gas_pics: 42,
        log_pics: 43,
        notes: 44,
        has_stored_pics: 45,
        stored_gas_pics: 46,
        stored_log_pics: 47,
        combined_names: 48,
        zone: 49,
        imos_vin: 50,
        imos_mileage: 51,
    }
};

const sheetCoreConfig: sheetCoreConfigInfo = {
    cacheKey: "SHEETCORE_LOGBOOKS",
    cacheExpiration: 1800,
    cacheEnabled: false,


};

let datastoreConfig: sheetDataEntry = {
    tabName: "slideData",
    headerRow: 0,
    includeSoftcodedColumns: true,
    initialColumnOrder: {
        gasCard: 0,
        logPageIdList: 1,
        receiptPageIdList: 2,
        month: 3,
        year: 4,

    }
};