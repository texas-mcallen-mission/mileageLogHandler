
function photoUpdater(): void {
    let startTime = new Date();
    let softCutoffInMinutes = 0.5;
    // step zero: cachelock - make sure we can actually run :)
    let locker = new doubleCacheLock("PHOTOMANAGER");
    let minRow = 0;
    let isSecondary = false;
    if (locker.isPrimaryLocked) {
        if (locker.isSecondaryLocked) {
            console.error("Full lockout detected, exiting!");
            return; // Should kill the program.
        } else {
            locker.lockSecondary();
            minRow = locker.minLine;
            isSecondary = true;
            if (minRow == 0) {
                return; // avoiding another way this thing can break
            }
        }
    } else {
        locker.lockPrimary();
    }

    let responseRSD = new RawSheetData(responseConfig);
    let responseSheet = new SheetData(responseRSD);
    // let outputRSD = new RawSheetData(datastoreConfig);
    // let outputSheet = new SheetData(outputRSD);

    let rawResponses = responseSheet.getData();

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
    responseData.removeMatchingByKey("has_stored_pics", [true]);
    if (minRow > 0) {
        responseData.removeSmaller(iterantKey, minRow);
    }
    let pulledRows: number[] = [];
    let outInfo: manyOutInfos = {}
    // let slideData: slideDataEntry[] = convertKisToSlideEntries(outputSheet.getData());
    // let newData: slideDataEntry[] = [];
    // let initialIndex = buildPositionalIndex(slideDataObj.end, "keyToBaseOffOf")

    let presentationCache: manyPresentations = {};


    // let loopDone = false
    // TODO: add check to see if nearing end of time available to save&quit safely
    // while (checkTime(startTime, 0.5) && loopDone == false) {
    let photoFolder = getPhotoFolder()
    // let newPhotos: GoogleAppsScript.Drive.File[] = [];
    for (let rawResponse of responseData.data) {
        if (checkTime_(startTime, softCutoffInMinutes)) {
            // this chunk co-opted and modified from moveNewPhotosToFolders
            let outInfo: outInfo = {
                has_stored_pics: false,
                stored_gas_pics: '',
                stored_log_pics: ''
            }
            let response = convertKiEntryToLogResponse(rawResponse);
            
            let gas_pic_urls: string[] = response.gas_pics.split(",");
            let log_pic_urls: string[] = response.log_pics.split(",");
            let gas_iterant: number = 1;
            let log_iterant: number = 1;
            // GR for gas, LB for log books
            let new_gas_urls: string[] = []
            let new_log_urls: string[] = []

            let subFolders: string[] = [String(response.report_year), response.report_month];
            for (let entry of gas_pic_urls) {
                entry.trim();
                let targetPhoto = getDocumentFromURL_(entry);
                let newName = String(response.card_number) + "_GR_" + String(gas_iterant);
                if (targetPhoto) { // makes sure that getDocumentFromURL doesn't fail and return null
                    let organizedPhoto = copyToSubfolderByArray_(targetPhoto, photoFolder, subFolders, newName);
                    // newPhotos.push(organizedPhoto);
                    new_gas_urls.push(organizedPhoto.getUrl())
                }
            }
            for (let entry of log_pic_urls) {
                entry.trim();
                let targetPhoto = getDocumentFromURL_(entry);
                let newName = String(response.card_number) + "_LP_" + String(log_iterant);
                if (targetPhoto) { // makes sure that getDocumentFromURL doesn't fail and return null
                    let organizedPhoto = copyToSubfolderByArray_(targetPhoto, photoFolder, subFolders, newName);
                    // newPhotos.push(organizedPhoto);
                    new_log_urls.push(organizedPhoto.getUrl())
                }
            }

            outInfo.stored_gas_pics = new_gas_urls.join(", ")
            outInfo.stored_log_pics = new_log_urls.join(", ")
            outInfo.has_stored_pics = true

            outInfo[rawResponse[iterantKey]] = outInfo
            pulledRows.push(rawResponse[iterantKey]);
        } else {
            break;
        }
    }
    // loopDone = true
    // }

    // outputSheet.insertData(newData);

    let column = responseSheet.getIndex("has_stored_pics");
    for (let entry of pulledRows) {
        // entry *might* need an offset.
        // JUMPER2 comment
        // calculating offsets:
        let output = []
        let stored_pic_col = responseSheet.getIndex("has_stored_pics")
        let log_pic_col = responseSheet.getIndex("stored_log_pics")
        let gas_pic_col = responseSheet.getIndex("stored_gas_pics")
        output[stored_pic_col - stored_pic_col] = outInfo[entry].has_stored_pics
        output[log_pic_col - stored_pic_col] = outInfo[entry].stored_log_pics
        output[gas_pic_col - stored_pic_col] = outInfo[entry].stored_gas_pics

        
        responseSheet.directEdit(entry + 1, column, output, true); // directEdit is zero-Indexed even though sheets is 1-indexed.
    }


    if (!isSecondary) {
        locker.unlockEverything();
    } else {
        console.log("exiting, not unlocking primary");
    }

}