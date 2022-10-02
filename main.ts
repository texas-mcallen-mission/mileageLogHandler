let sheetConfig: sheetDataEntry = {
    tabName: "Form Responses",
    headerRow: 0,
    includeSoftcodedColumns: true,
    initialColumnOrder: {
        timestamp: 1,
        area_name: 2,
        email: 3,
        report_month: 4,
        report_year: 5,
        pulled: 6,
        car_year: 7,
        car_make: 8,
        car_model: 9,
        car_lpn: 10,
        car_vin_five: 11,
        card_number: 12,
        odo_start: 13,
        odo_end: 14,
        mile_sum: 15,
        has_forgiveness: 16,
        qty_forgiveness: 17,
        forgive_types: 18,
        rp_1: 19,
        rc_1: 20,
        rp_2: 21,
        rc_2: 22,
        rp_3: 23,
        rc_3: 24,
        rp_4: 25,
        rc_4: 26,
        rp_5: 27,
        rc_5: 28,
        rp_6: 29,
        rc_6: 30,
        rp_7: 31,
        rc_7: 32,
        rp_8: 33,
        rc_8: 34,
        rp_9: 35,
        rc_9: 36,
        rp_10: 37,
        rc_10: 38,
        rp_11: 39,
        rc_11: 40,
        rp_12: 41,
        rc_12: 42,
        gas_pics: 43,
        log_pics: 44,
    }
};

interface folderReturn {
    id: string,
    folder: GoogleAppsScript.Drive.Folder
}

function getBaseFolder():folderReturn {
    let sheetFile = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId());
    let parentFolder = sheetFile.getParents()
    let outFolder = parentFolder.next()
    let id = outFolder.getId()

    return {
        id: id,
        folder:outFolder
    }
}

function getPhotoFolder(): folderReturn {
    let baseFolder = getBaseFolder()

    let photoFolderName = "Log Photos"
    let folderTest = baseFolder.folder.getFoldersByName(photoFolderName)

    // Check to see if there's a folder with a matching name
    if (folderTest.hasNext()) {
        let folder = folderTest.next()
        return {
            id: folder.getId(),
            folder:folder
        }
    } else {
        let folder = baseFolder.folder.createFolder(photoFolderName)
        return {
            id: folder.getId(),
            folder:folder
        }
    }
}

function moveNewPhotosToFolders() {
    let rsdIn1 = new RawSheetData(sheetConfig)
    let log_responses = new SheetData(rsdIn1)

    let data = log_responses.getData()
    let rows_pulled = data.length

    let logData:kiDataClass = new kiDataClass(data)

    logData.keepMatchingByKey("pulled", [""])
    
   

}