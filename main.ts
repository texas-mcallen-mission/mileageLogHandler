





interface cacheEntry {
    active: boolean,
    lastUpdate: number;
}

function runUpdates(): void{
    let startTime = new Date()
    let softCutoffInMinutes = 0.5
    // step zero: cachelock - make sure we can actually run :)
    let locker = new doubleCacheLock()
    let minRow = 0
    let isSecondary = false
    if (locker.isPrimaryLocked) {
        if (locker.isSecondaryLocked) {
            console.error("Full lockout detected, exiting!")
            return // Should kill the program.
        } else {
            locker.lockSecondary()
            minRow = locker.minLine
            isSecondary = true
            if (minRow == 0) {
                return; // avoiding another way this thing can break
            }
        }
    } else {
        locker.lockPrimary()
    }

    let responseRSD = new RawSheetData(responseConfig)
    let responseSheet = new SheetData(responseRSD)
    let outputRSD = new RawSheetData(datastoreConfig)
    let outputSheet = new SheetData(outputRSD)

    let rawResponses = responseSheet.getData()

    // cachelock: small check to make sure that we don't need to run.
    if (isSecondary && rawResponses.length <= minRow) {
        return // we don't need to do anything if there's no entries.
    }

    let maxRow = rawResponses.length
    
    // cachelock: now it's time to set the min allowable row and enable secondary executions.
    locker.minLine = maxRow + 1
    locker.unlockSecondary()


    let responseData = new kiDataClass(rawResponses)
    let iterantKey = "iterant"
    
    responseData.addIterant(iterantKey,0);
    responseData.removeMatchingByKey("pulled", [true])
    
    let pulledRows: number[] = []
    
    let slideData: slideDataEntry[] = convertKisToSlideEntries(outputSheet.getData());
    let newData: slideDataEntry[] = [];
    // let initialIndex = buildPositionalIndex(slideDataObj.end, "keyToBaseOffOf")

    let presentationCache: manyPresentations = {}


    // let loopDone = false
    // TODO: add check to see if nearing end of time available to save&quit safely
    // while (checkTime(startTime, 0.5) && loopDone == false) {
    for (let rawResponse of responseData.data) {
        if (checkTime_(startTime, softCutoffInMinutes)) {
            let response = convertKiEntryToLogResponse(rawResponse)
            let presentationString = String(response.report_year) + response.report_month
            let presentation:GoogleAppsScript.Slides.Presentation
            if (presentationCache.hasOwnProperty(presentationString)) {
                presentation = presentationCache[presentationString]
            } else {
                presentation = getLogbook(response.report_year, response.report_month)
                presentationCache[presentationString] = presentation
            }
            // build index, because it gets out of date
            let newSlides: slideDataEntry = addSlidesForEntry(response, presentation, slideData);
            slideData.push(newSlides);
            newData.push(newSlides);
            pulledRows.push(rawResponse[iterantKey])
        } else {
            break
        }
    }
    // loopDone = true
    // }
    
    outputSheet.insertData(newData)
    
    let column = responseSheet.getIndex("pulled")
    for (let entry of pulledRows) {
        // entry *might* need an offset.
        // JUMPER comment
        responseSheet.directEdit(entry + 1, column, [[true]], true); // directEdit is zero-Indexed even though sheets is 1-indexed.
    }


    if (!isSecondary) {
        locker.unlockEverything()
    } else {
        console.log("exiting, not unlocking primary")
    }
    
}

/**
 *  Checks to make sure that the system isn't going to fail to finish because it went overtime. 
 *
 * @param {Date} startTime
 * @return {*}  {boolean}
 */
function checkTime_(startTime: Date,maxTimeInMinutes:number) :boolean{
    let currentTime = new Date()
    let minuteToMillis = maxTimeInMinutes * 60000
    if (currentTime.getTime() - startTime.getTime() < minuteToMillis) {
        return true
    } else {
        console.log("Running out of time!")
        return false
    }
}

function TEST_setPrimaryLock() {
    let locker = new doubleCacheLock();
    let preStatus = locker.isPrimaryLocked;
    if (!preStatus) {
        locker.lockPrimary()
        locker.minLine = 2
        console.log("locked Primary");
    } else {
        console.log("primary already locked");
    }
}
function TEST_full_lock() {
    let locker = new doubleCacheLock();
    // let preStatus = locker.isPrimaryLocked;
    // if (!preStatus) {
        locker.lockPrimary()
        locker.lockSecondary()
        console.log("locked everything");
    // } else {
    //     console.log("primary already locked");
    // }
}

function TEST_lockerData() {
    let locker = new doubleCacheLock()
    let start_data = locker.getData()
    locker.unlockPrimary()
    locker.unlockSecondary()
    let unlocked_data = locker.getData()
    locker.lockPrimary()
    locker.lockSecondary()
    let final_data = locker.getData()

    let datas = [start_data, unlocked_data, final_data];
    for (let key in start_data) {
        start_data.primary.lastUpdate
        if (start_data[key]["lastUpdate"] == unlocked_data[key]["lastUpdate"] || unlocked_data[key]["lastUpdate"] == final_data[key]["lastUpdate"]) {
            console.log("no change for ",key)
        }
    }
    
    console.log(locker.getData(),locker.minLine)
}
interface manyPresentations {
    [index:string]:GoogleAppsScript.Slides.Presentation
}

function parseDoubleLockValue(cacheVal: string | null): cacheEntry {
    let output: cacheEntry = {
        active: false, // these are the default values; this might want to be modified in the future.
        lastUpdate: 0
    };

    if (cacheVal) {
        let deString = JSON.parse(cacheVal);
        try {
            output.active = deString["active"];
            output.lastUpdate = deString["lastUpdate"];
        } catch (error) {
            console.warn("error parsing cache");
            return output;
        }
    }

    return output;
}

interface cacheData {
    primary: cacheEntry,
    secondary:cacheEntry
}

class doubleCacheLock {
    prefix: string = "SLIDEMAN_CACHE";
    primaryStr: string = "Lock1";
    secondaryStr: string = "Lock2";
    maxLineKey:string = "maxLine"
    cacheObj: GoogleAppsScript.Cache.Cache;
    expiration: number = 30 * 60; // 30 minutes * 60 seconds each
    debug = true

    constructor() {
        this.cacheObj = CacheService.getScriptCache();

        return this;
    }

    getKeys() {
        let output: string[] = [];
        output.push(this.prefix + this.primaryStr);
        output.push(this.prefix + this.secondaryStr);
        return output;
    }

    getData():cacheData {
        let key1 = this.prefix + this.primaryStr;
        let key2 = this.prefix + this.secondaryStr;
        // let keys = [key1, key2];
        let keys = {
            primary: this.prefix + this.primaryStr,
            secondary: this.prefix + this.secondaryStr
        }
        //@ts-ignore this is getting generated right here :)
        let output:cacheData = {};
        for (let key in keys) {
            let cacheVal = this.cacheObj.get(keys[key])
            console.log(cacheVal)
            output[key] = parseDoubleLockValue(cacheVal) 
        }
        return output
    }
    internalLocker(key: string, active: boolean) {
        let updateDate = new Date();
        let updateTime = updateDate.getTime();
        let entryStruct: cacheEntry = {
            active: true,
            lastUpdate: updateTime
        };
        let entryData = JSON.stringify(entryStruct);
        this.cacheObj.put(key, entryData)
    }
    get isPrimaryLocked():boolean {
        let data = this.getData()
        return data.primary.active
    }
    get isSecondaryLocked(): boolean {
        let data = this.getData();
        return data.secondary.active;
    }
    lockPrimary() {
        this.internalLocker(this.prefix + this.primaryStr, true)
        
    }
    lockSecondary() {
        this.internalLocker(this.prefix + this.secondaryStr, true)
    }

    unlockPrimary() {
        this.internalLocker(this.prefix + this.primaryStr, false)
    }
    unlockSecondary() {
        this.internalLocker(this.prefix + this.secondaryStr, false)
    }
    unlockEverything() {
        this.internalLocker(this.prefix + this.primaryStr, false);
        this.internalLocker(this.prefix + this.secondaryStr, true)
    }
    get minLine(): number {
        let lineKey = this.prefix + this.maxLineKey
        let cacheLockVal = this.cacheObj.get(lineKey)
        if (cacheLockVal) {
            return +cacheLockVal
        } else {
            return 0 // I *think* this should work- if there's no activity, then there shouldn't be any problems here, right?
        }
    }
    set minLine(line: number) {
        if (typeof line == typeof 12) {
            let lineKey = this.prefix + this.maxLineKey
            this.cacheObj.put(lineKey,String(line))
        } else {
            console.error("minLine not number");
        }
    }
}


function moveNewPhotosToFolders() {
    let rsdIn1 = new RawSheetData(responseConfig);
    let log_responses = new SheetData(rsdIn1);

    let data = log_responses.getData();
    let rows_pulled = data.length;

    let logData: kiDataClass = new kiDataClass(data);

    let photoFolder = getPhotoFolder();

    // @ts-expect-error I know this is maybe not the best form, but I can almost guarantee this format, and it makes things easier down the line.  #watchme
    let start_data: log_data[] = logData.keepMatchingByKey("pulled", [""]).end;
    let newPhotos: GoogleAppsScript.Drive.File[] = [];
    for (let submission of start_data) {
        let gas_pic_urls: string[] = submission.gas_pics.split(",");
        let log_pic_urls: string[] = submission.log_pics.split(",");
        let gas_iterant: number = 1;
        let log_iterant: number = 1;
        // GR for gas, LB for log books
        let subFolders: string[] = [String(submission.report_year), submission.report_month];
        for (let entry of gas_pic_urls) {
            entry.trim();
            let targetPhoto = getDocumentFromURL_(entry);
            let newName = String(submission.card_number) + "_GR_" + String(gas_iterant);
            if (targetPhoto) { // makes sure that getDocumentFromURL doesn't fail and return null
                let organizedPhoto = copyToSubfolderByArray_(targetPhoto, photoFolder, subFolders, newName);
                newPhotos.push(organizedPhoto);
                // let organizedPhotoURL = organizedPhoto.getUrl()
            }
        }
        for (let entry of log_pic_urls) {
            entry.trim();
            let targetPhoto = getDocumentFromURL_(entry);
            let newName = String(submission.card_number) + "_LP_" + String(log_iterant);
            if (targetPhoto) { // makes sure that getDocumentFromURL doesn't fail and return null
                let organizedPhoto = copyToSubfolderByArray_(targetPhoto, photoFolder, subFolders, newName);
                newPhotos.push(organizedPhoto);
            }
        }
    }

    // at this point, all I need to do is mark things as pulled and the sorting of photos is done.
    // I also need to add a cache locker so that I don't end up with duplicates.


}



let responseConfig: sheetDataEntry = {
    tabName: "Form Responses 1",
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
    }
};

const sheetCoreConfig: sheetCoreConfigInfo = {
    cacheKey: "SHEETCORE_LOGBOOKS",
    cacheExpiration: 1800,
    cacheEnabled: false,


}

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
}

function getBaseFolder(): GoogleAppsScript.Drive.Folder {
    let sheetFile = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId());
    let parentFolder = sheetFile.getParents()
    let outFolder = parentFolder.next()
    let id = outFolder.getId()

    return outFolder
}

function getPhotoFolder(): GoogleAppsScript.Drive.Folder {
    let baseFolder = getBaseFolder()

    let photoFolderName = "Log Photos"
    let folderTest = baseFolder.getFoldersByName(photoFolderName)

    // Check to see if there's a folder with a matching name
    if (folderTest.hasNext()) {
        let folder = folderTest.next()
        return folder
        
    } else {
        let folder = baseFolder.createFolder(photoFolderName)
        return folder
    }
}



// takes a folder, a drive Document, and a 2d array of subfolders, copy a thing.  Returns a GoogleAppsScript.Drive.File of the copied object.
//
function copyToSubfolderByArray_(document: GoogleAppsScript.Drive.File, parentFolder: GoogleAppsScript.Drive.Folder, subfolders: string[],newName:string):GoogleAppsScript.Drive.File {
    let targetFolder = parentFolder
    let subFolderIterant = [...subfolders] // yay mutatability!
    
    // maybe check subfolders to see if it's an array?  It's type-required though :)
    while (subFolderIterant.length > 0) {
        let newTarget = targetFolder.getFoldersByName(subFolderIterant[0])
        if (newTarget.hasNext()) {
            targetFolder = newTarget.next()
        } else {
            let newTarget = targetFolder.createFolder(subFolderIterant[0])
            targetFolder = newTarget
        }
        subFolderIterant.shift()
    }

    return document.makeCopy(newName,targetFolder)

}

function getIdFromUrl_(url: string): string {
    let regexData = url.match(/[-\w]{25,}(?!.*[-\w]{25,})/) 
    if (regexData == null) {
        return ""
    } else {
        return regexData.toString()
    }

}

function getDocumentFromURL_(url):GoogleAppsScript.Drive.File | null {
    let docId = getIdFromUrl_(url)
    try {
        let document: GoogleAppsScript.Drive.File = DriveApp.getFileById(docId)
        return document
    } catch (error) {
        console.log(error)
        return null
    }
}