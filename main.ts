





interface cacheEntry {
    active: boolean,
    lastUpdate: number;
}

function updateAreaNames() {
    let formURL = config.response_form_url
    if (GITHUB_SECRET_DATA.hasOwnProperty("response_form_url")) {
        formURL = GITHUB_SECRET_DATA.response_form_url
    }

    let contactRSD = new RawSheetData(contactConfig);
    let contactSheet = new SheetData(contactRSD);

    let contactData = new kiDataClass(contactSheet.getData());
    let areaNames = contactData.getUniqueEntries("areaName")
    let form:GoogleAppsScript.Forms.Form
    try {
        form = FormApp.openByUrl(formURL)
        
    } catch (error) {
        console.error("formApp unable to open response form")
        return // quits the function outright.
    }

    let items = form.getItems(FormApp.ItemType.LIST)
    let areaNameItem = undefined
    for (let i = 0; i < items.length && typeof areaNameItem == 'undefined'; i++){
        if (items[i].asListItem().getTitle() == config.areaNameQuestion) {
            areaNameItem = items[i]
        }
    }
    if (typeof areaNameItem == 'undefined') {
        throw "unable to find area name question!"
    }
    areaNameItem.asListItem().setChoiceValues(areaNames)


    
}

function runUpdates(): void {
    // store start time for logging, also to make sure we don't overrun execution time.
    let startTime = new Date();
    let softCutoffInMinutes = config.softCutoffInMinutes;
    // step zero: cachelock - make sure we can actually run :)
    let locker = new doubleCacheLock();
    let minRow = 0;
    let isSecondary = false;
    // double-cachelock
    if (locker.isPrimaryLocked) {
        if (locker.isSecondaryLocked) {
            console.error("Full lockout detected, exiting!");
            return; // Should kill the program.
        } else {
            locker.lockSecondary();
            // only pull rows after the given row
            minRow = locker.minLine;
            isSecondary = true;
            if (minRow == 0) {
                return; // avoiding another way this thing can break
            }
        }
    } else {
        locker.lockPrimary();
    }
    // load up sheetData

        // let responseRSD = new RawSheetData(responseConfig);
    const responseSheet = new SheetData(new RawSheetData(responseConfig));
        // let datastoreRSD = new RawSheetData(datastoreConfig);
    const sortStoreRSD = new SheetData(new RawSheetData(datastoreConfig));
    // let contactRSD = new RawSheetData(contactConfig);
    const contactSheet = new SheetData(new RawSheetData(contactConfig));

    const rawResponses = responseSheet.getData();

    // cachelock: small check to make sure that we don't need to run.
    if (isSecondary && rawResponses.length <= minRow) {
        return; // we don't need to do anything if there's no entries.
    }

    let maxRow = rawResponses.length;

    // cachelock: now it's time to set the min allowable row and enable secondary executions.
    locker.minLine = maxRow + 1;
    locker.unlockSecondary();


    let responseData = new kiDataClass(rawResponses);
    let iterantKey = "iterant";

    responseData.addIterant(iterantKey, 0);
    responseData.removeMatchingByKey("pulled", [true]);
    if (minRow > 0) {
        responseData.removeSmaller(iterantKey, minRow);
    }
    let pulledRows: number[] = [];
    let rowData: kiDataEntry[] = [];



    let contactDataClass = new kiDataClass(contactSheet.getData());
    contactDataClass.calculateCombinedName();
    let contactDataKeyed = contactDataClass.groupByKey("areaName");

    // combine contact data with kiData so that I get zone info and stuff out
    let contactData_keymap = {
        "area_name": "areaName",
        "zone": "zone",
        "imos_vin": "vinLast8",
        "imos_mileage": "vehicleMiles",
        "combined_names": "combinedNames"
    };
    // for (let rawResponse of responseData.data) {
    //     let response = convertKiEntryToLogResponse(rawResponse)
    //     if (test.hasOwnProperty(response.area_name)) {
    //         let areaInfo = test[response.area_name]

    //         for (let key in keymap) {
    //             if (areaInfo.hasOwnProperty(keymap[key])) {
    //                 response[key] = areaInfo[keymap[key]]
    //             }
    //         }
    //     }
    // }


    let slideData: slideDataEntry[] = convertKisToSlideEntries(sortStoreRSD.getData());
    let newData: slideDataEntry[] = [];
    // let initialIndex = buildPositionalIndex(slideDataObj.end, "keyToBaseOffOf")

    let presentationCache: manyPresentations = {};


    for (let rawResponse of responseData.data) {
        if (checkTime_(startTime, softCutoffInMinutes)) {
            let response: logResponseEntry = convertKiEntryToLogResponse(rawResponse);
            let IMOS_output: kiDataEntry = {};
            if (!config.disableMarkingPulled) {
                IMOS_output["pulled"] = true;
            }

            // adding in IMOS data
            if (contactDataKeyed.hasOwnProperty(response.area_name)) {
                // console.log(contactDataKeyed)
                let areaInfo = contactDataKeyed[response.area_name][0];
                // copies the data from contactData to the keys used by this one to store the same values
                for (let key in contactData_keymap) {
                    if (areaInfo.hasOwnProperty(contactData_keymap[key])) {
                        let data = areaInfo[contactData_keymap[key]];
                        response[key] = data;
                        IMOS_output[key] = data;
                    }
                }
            } else {
                console.error("unable to find data for " + response.area_name);
            }


            // and now to the rest of the stuff.


            let presentationString = String(response.report_year) + response.report_month;
            let presentation: GoogleAppsScript.Slides.Presentation;
            if (presentationCache.hasOwnProperty(presentationString)) {
                presentation = presentationCache[presentationString];
            } else {
                presentation = getLogbook(response.report_year, response.report_month);
                presentationCache[presentationString] = presentation;
            }
            // build index, because it gets out of date
            let newSlides: slideDataEntry = addSlidesForEntry(response, presentation, slideData);
            slideData.push(newSlides);
            newData.push(newSlides);
            pulledRows.push(rawResponse[iterantKey]);
            rowData.push(IMOS_output);
        } else {
            break;
        }
    }


    sortStoreRSD.insertData(newData);

    let column = responseSheet.getIndex("pulled");
    for (let i = 0; i < pulledRows.length; i++) {
        let targetRow = pulledRows[i];
        let data = rowData[i];
        // entry *might* need an offset.
        // JUMPER comment
        // let output:any[] = [true]
        if (config.disableMarkingPulled == true) {
            data["pulled"] = [GITHUB_DATA.commit_sha.slice(0, 8) + "WORD"];
        }
        // responseSheet.directEdit(entry + 1, column, [output], true); // directEdit is zero-Indexed even though sheets is 1-indexed.
        responseSheet.directModify(targetRow + 1, data);
    }


    if (!isSecondary) {
        locker.unlockEverything();
    } else {
        console.log("exiting, not unlocking primary");
    }

}

interface outInfo {
    has_stored_pics: boolean,
    stored_gas_pics: string,
    stored_log_pics: string;
}

interface manyOutInfos {
    [index: string]: outInfo;
}

/**
 *  Checks to make sure that the system isn't going to fail to finish because it went overtime. 
 *
 * @param {Date} startTime
 * @return {*}  {boolean}
 */
function checkTime_(startTime: Date, maxTimeInMinutes: number): boolean {
    let currentTime = new Date();
    let minuteToMillis = maxTimeInMinutes * 60000;
    if (currentTime.getTime() - startTime.getTime() < minuteToMillis) {
        return true;
    } else {
        console.log("Running out of time!");
        return false;
    }
}
function TEST_clearCache() {
    let locker = new doubleCacheLock();
    locker.unlockEverything();
    TEST_getStatus(locker);
}

function TEST_removeSmaller() {
    let data = [
        { testKey: 0, words: "data0" },
        { testKey: 1, words: "data1" },
        { testKey: 2, words: "data2" },
        { testKey: 3, words: "data3" },
        { testKey: 4, words: "data4" },
        { testKey: 5, words: "data5" },
        { testKey: 6, words: "data6" },
    ];

    let kiData = new kiDataClass(data);
    kiData.removeSmaller("testKey", 4);
    let outData = kiData.end;
    if (outData.length = 3) {
        console.log("Removal Worked!");
    } else {
        throw new Error("Removal failed!");

    }
}

function TEST_getStatus(locker: doubleCacheLock | undefined = undefined) {
    if (!locker) {
        locker = new doubleCacheLock();

    }
    console.log(locker.getData());
}
function TEST_setPrimaryLock() {
    let locker = new doubleCacheLock();
    let preStatus = locker.isPrimaryLocked;
    if (!preStatus) {
        locker.lockPrimary();
        locker.minLine = 2;
        console.log("locked Primary");
    } else {
        console.log("primary already locked");
    }
    TEST_getStatus(locker);
}
function TEST_full_lock() {
    let locker = new doubleCacheLock();
    // let preStatus = locker.isPrimaryLocked;
    // if (!preStatus) {
    locker.lockPrimary();
    locker.lockSecondary();
    console.log("locked everything");
    // } else {
    //     console.log("primary already locked");
    // }
    TEST_getStatus(locker);
}

function TEST_lockerData() {
    let locker = new doubleCacheLock();
    let start_data = locker.getData();
    locker.unlockPrimary();
    locker.unlockSecondary();
    let unlocked_data = locker.getData();
    locker.lockPrimary();
    locker.lockSecondary();
    let final_data = locker.getData();

    let datas = [start_data, unlocked_data, final_data];
    for (let key in start_data) {
        start_data.primary.lastUpdate;
        if (start_data[key]["lastUpdate"] == unlocked_data[key]["lastUpdate"] || unlocked_data[key]["lastUpdate"] == final_data[key]["lastUpdate"]) {
            console.log("no change for ", key);
        }
    }

    console.log(locker.getData(), locker.minLine);
    TEST_getStatus(locker);
}
interface manyPresentations {
    [index: string]: GoogleAppsScript.Slides.Presentation;
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
    secondary: cacheEntry;
}

class doubleCacheLock {
    prefix = "SLIDEMAN_CACHE";
    primaryStr = "Lock1";
    secondaryStr = "Lock2";
    maxLineKey = "maxLine";
    cacheObj: GoogleAppsScript.Cache.Cache;
    expiration: number = 30 * 60; // 30 minutes * 60 seconds each
    debug = true;

    constructor(prefixMod = "NONE") {
        if (prefixMod != "NONE") {
            this.prefix += prefixMod;
        }
        this.cacheObj = CacheService.getScriptCache();

        return this;
    }

    getKeys() {
        let output: string[] = [];
        output.push(this.prefix + this.primaryStr);
        output.push(this.prefix + this.secondaryStr);
        return output;
    }

    getData(): cacheData {
        let key1 = this.prefix + this.primaryStr;
        let key2 = this.prefix + this.secondaryStr;
        // let keys = [key1, key2];
        let keys = {
            primary: this.prefix + this.primaryStr,
            secondary: this.prefix + this.secondaryStr
        };
        //@ts-ignore this is getting generated right here :)
        let output: cacheData = {};
        for (let key in keys) {
            let cacheVal = this.cacheObj.get(keys[key]);
            console.log(cacheVal);
            output[key] = parseDoubleLockValue(cacheVal);
        }
        return output;
    }
    internalLocker(key: string, active: boolean) {
        let updateDate = new Date();
        let updateTime = updateDate.getTime();
        let entryStruct: cacheEntry = {
            active: true,
            lastUpdate: updateTime
        };
        entryStruct.active = active;
        let entryData = JSON.stringify(entryStruct);
        this.cacheObj.put(key, entryData);
    }
    get isPrimaryLocked(): boolean {
        let data = this.getData();
        return data.primary.active;
    }
    get isSecondaryLocked(): boolean {
        let data = this.getData();
        return data.secondary.active;
    }
    lockPrimary() {
        this.internalLocker(this.prefix + this.primaryStr, true);

    }
    lockSecondary() {
        this.internalLocker(this.prefix + this.secondaryStr, true);
    }

    unlockPrimary() {
        this.internalLocker(this.prefix + this.primaryStr, false);
    }
    unlockSecondary() {
        this.internalLocker(this.prefix + this.secondaryStr, false);
    }
    unlockEverything() {
        this.internalLocker(this.prefix + this.primaryStr, false);
        this.internalLocker(this.prefix + this.secondaryStr, false);
        this.minLine = 0;
    }
    get minLine(): number {
        let lineKey = this.prefix + this.maxLineKey;
        let cacheLockVal = this.cacheObj.get(lineKey);
        if (cacheLockVal) {
            return +cacheLockVal;
        } else {
            return 0; // I *think* this should work- if there's no activity, then there shouldn't be any problems here, right?
        }
    }
    set minLine(line: number) {
        if (typeof line == typeof 12) {
            let lineKey = this.prefix + this.maxLineKey;
            this.cacheObj.put(lineKey, String(line));
        } else {
            console.error("minLine not number");
        }
    }
}



// CONFIGURATION


function getBaseFolder(): GoogleAppsScript.Drive.Folder {
    let photoKey = "photoArchive_FolderID";
    // let baseFolderId;
    if (GITHUB_SECRET_DATA.hasOwnProperty(photoKey) && GITHUB_SECRET_DATA[photoKey] != "") {
        try {
            let outFolder = DriveApp.getFolderById(GITHUB_SECRET_DATA[photoKey]);
            return outFolder;
        } catch (error) {
            console.log("basefolder not specified / functional in github secrets");
        }
    } else if (config.hasOwnProperty(photoKey) && config[photoKey] != "") {
        try {
            let outFolder = DriveApp.getFolderById(config[photoKey])
            return outFolder
        } catch (error) {
            console.log("basefolder not specified / functional in config.  defaulting to base folder of containing spreadsheet.")
        }
    }

    let sheetFile = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId());
    let parentFolder = sheetFile.getParents();
    let outFolder = parentFolder.next();

    return outFolder;
}

function getPhotoFolder(): GoogleAppsScript.Drive.Folder {

    let baseFolder = getBaseFolder();

    let photoFolderName = "Log Photos";
    let folderTest = baseFolder.getFoldersByName(photoFolderName);

    // Check to see if there's a folder with a matching name
    if (folderTest.hasNext()) {
        let folder = folderTest.next();
        return folder;

    } else {
        let folder = baseFolder.createFolder(photoFolderName);
        return folder;
    }
}



// takes a folder, a drive Document, and a 2d array of subfolders, copy a thing.  Returns a GoogleAppsScript.Drive.File of the copied object.
//
function copyToSubfolderByArray_(document: GoogleAppsScript.Drive.File, parentFolder: GoogleAppsScript.Drive.Folder, subfolders: string[], newName: string): GoogleAppsScript.Drive.File {
    let targetFolder = parentFolder;
    let subFolderIterant = [...subfolders]; // yay mutatability!

    // maybe check subfolders to see if it's an array?  It's type-required though :)
    while (subFolderIterant.length > 0) {
        let newTarget = targetFolder.getFoldersByName(subFolderIterant[0]);
        if (newTarget.hasNext()) {
            targetFolder = newTarget.next();
        } else {
            let newTarget = targetFolder.createFolder(subFolderIterant[0]);
            targetFolder = newTarget;
        }
        subFolderIterant.shift();
    }

    return document.makeCopy(newName, targetFolder);

}

function getIdFromUrl_(url: string): string {
    let regexData = url.match(/[-\w]{25,}(?!.*[-\w]{25,})/);
    if (regexData == null) {
        return "";
    } else {
        return regexData.toString();
    }

}

function getDocumentFromURL_(url): GoogleAppsScript.Drive.File | null {
    let docId = getIdFromUrl_(url);
    try {
        let document: GoogleAppsScript.Drive.File = DriveApp.getFileById(docId);
        return document;
    } catch (error) {
        console.log(error);
        return null;
    }
}