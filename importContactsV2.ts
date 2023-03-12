//@ts-check
// Written by Elder Lo Forte

function importContactsV2(contactDataSheet: SheetData): void {

    console.time('Execution Time');

//const allSheetData : manySheetDatas= constructSheetDataV3(["closedAreas", "contact"])
// don't need closed areas
// const closedAreasSheet: SheetData = allSheetData.closedAreas;
// const contactDataSheet: SheetData = allSheetData.contact;

// gets old data and new data
const ogDataClass = new kiDataClass(contactDataSheet.getData());
const newContactData: contactEntry[] = getArrayOfContacts();


// if there are less than 5 contacts... (Thank you Elder Perez) it will throw an error
if (newContactData.length <= 5) {
    console.error("Contacts Probably got deleted!!!!");
    throw "Oh Boy The Contacts Se fue!";
}
contactDataSheet.setData(newContactData); // sets the new data

const newContactClass = new kiDataClass(newContactData);

// pulls all of the closed areas
const newAreaIDs: string[] = newContactClass.getDataFromKey("areaID");
ogDataClass.removeMatchingByKey("areaID", newAreaIDs);
ogDataClass.bulkAppendObject({
    "deletionDate": convertToSheetDate_(new Date())
});
const leftovers: kiDataEntry[] = ogDataClass.end;

// if nothing changes dont push it
// if (leftovers.length > 0) {
//     closedAreasSheet.appendData(leftovers);
// }

console.timeEnd('Execution Time');

}



/**
 * gets the most recent kiDataEntry given an array and a key
 *
 * @param {kiDataEntry[]} kiData
 * @param {string} dateKey
 * @return {*}  {kiDataEntry}
 */
function getMostRecentKiEntryByDateKey_(kiData: kiDataEntry[], dateKey: string): kiDataEntry {
    let testVal: kiDataEntry = kiData[0];
    for (const entry of kiData) {
        const comparisonDate: Date = new Date(entry[dateKey]);
        const testDate: Date = new Date(testVal[dateKey]);

        if (comparisonDate.getTime() < testDate.getTime()) {
            testVal = entry;
        }

    }
    return testVal;

}

/*
pretty much just loops all of the contacts and pulls all of the data
*/
function getArrayOfContacts(): contactEntry[] {

    //Pull in contact data from Google Contacts
    const group: GoogleAppsScript.Contacts.ContactGroup = ContactsApp.getContactGroup('IMOS Roster'); // Fetches group by groupname 
    const contacts: GoogleAppsScript.Contacts.Contact[] = group.getContacts(); // Fetches contact list of group 

    const arrayOfContacts: contactEntry[] = [];
    for (const contact of contacts) {
        arrayOfContacts.push(convertToContactData(contact));
    }
    return arrayOfContacts;

} // end wirteArray




/*
Gets all of the data from the contact and retruns it as an object with the contactEntry interface.
*/
function convertToContactData(c: GoogleAppsScript.Contacts.Contact): contactEntry {

    // declares cDataObject as a contactEntry
    const cDataObject: contactEntry = {
        dateContactGenerated: '',
        areaEmail: '',
        areaName: '',
        name1: '',
        position1: '',
        isTrainer1: false,
        name2: '',
        position2: '',
        isTrainer2: false,
        name3: '',
        position3: '',
        isTrainer3: false,
        district: '',
        zone: '',
        unitString: '',
        hasMultipleUnits: false,
        languageString: '',
        isSeniorCouple: false,
        isSisterArea: false,
        hasVehicle: false,
        vehicleMiles: '',
        vinLast8: '',
        aptAddress: '',
        areaID: '',
        phoneNumber: '',
        missionaryEmail1: '',
        missionaryEmail2: '',
        missionaryEmail3: '',
    };

    const allEmails = c.getEmails();

    // Array.shift() returns the top entry in an array and removes it.
    const areaEmail = allEmails.shift();
    cDataObject["areaEmail"] = areaEmail.getAddress();
    cDataObject["areaName"] = areaEmail.getDisplayName();
    // loops through each email and sets the name, position and, isTrainer
    for (let i = 0; i < allEmails.length; i++) {
        const entry = allEmails[i];
        const epos = i + 1; // Position
        cDataObject["name" + epos] = entry.getDisplayName();
        const label = entry.getLabel().toString();
        cDataObject["position" + epos] = label.slice(-5).replace(/[^a-z0-9]/gi, ''); // .replace(/[^a-z]/gi, '') makes only letters and numbers
        cDataObject["isTrainer" + epos] = isTrainer(cDataObject["position" + epos]);
        cDataObject["missionaryEmail" + epos] = entry.getAddress().toString();
    }

    cDataObject.dateContactGenerated = c.getLastUpdated().toDateString(); // date last updates

    cDataObject.areaEmail = c.getEmails()[0].getAddress(); // getting areaEmail


    // everything from notes
    const getNotes: string = c.getNotes().toString().replaceAll(": ", ":");
    const getNotesArray: string[] = getNotes.split("\n");


    /*
    every contact has a note section
    this gets the notes and splits it by new line
    Then it splits it all by ":" then it looks up the data and sets it based on all of that...
    */
    for (let i = 0; i < getNotesArray.length; i++) {

        const objectNotes: string[] = getNotesArray[i].split(":");

        const type: string = objectNotes[0];
        const words: string = objectNotes[1];

        if (type.includes("Area")) cDataObject.areaName = words;
        if (type.includes("Zone")) cDataObject.zone = words;
        if (type.includes("District")) cDataObject.district = words;
        if (type.includes("Ecclesiastical Unit")) cDataObject.unitString = words.trim();
        if (type.includes("Ecclesiastical Units")) cDataObject.hasMultipleUnits = true;

        //Vehicle stuff all right here
        if (type.includes("Vehicle")) cDataObject.hasVehicle = true;

        if (cDataObject.hasVehicle) {
            if (type.includes("Vehicle VIN Last 8")) cDataObject.vinLast8 = words;
            if (type.includes("Vehicle Allowance/Mo")) cDataObject.vehicleMiles = words;
        }

        // gets tells if its a sisters or elders area
        if (c.getNotes().includes("Junior Sister")) cDataObject.isSisterArea = true;

        // tells if its a senior or not
        if (c.getNotes().includes("Senior Couple")) cDataObject.isSeniorCouple = true;
    }

    // getting address of apt.
    if (c.getAddresses().length != 0) cDataObject.aptAddress = c.getAddresses()[0].getAddress().toString().replace("\n", " ").replace("\n", " ");
    // .replace("\n", " ").replace("\n", " ") makes it get rid of new lines and one line

    // gets the area id's
    const areaID: string = "A" + cDataObject.areaEmail.replace("@missionary.org", "");
    cDataObject.areaID = areaID;

    // gets phone number
    const phones: GoogleAppsScript.Contacts.PhoneField[] = c.getPhones();
    const phoneNumbers: string[] = [];
    for (const entry of phones) {
        phoneNumbers.push(entry.getPhoneNumber());
    }
    cDataObject.phoneNumber = phoneNumbers.join(", ");

    return cDataObject;
}

// put in the position and tells me if its a trainer or not... that is all
function isTrainer(position: string): boolean {
    switch (position) {
        case "TR":
        case "DT":
        case "ZLT":
        case "STLT":
            return true;
        default:
            return false;
    } // end switch
} // end isTrainer

interface contactEntry extends kiDataEntry {
    dateContactGenerated: string,
    areaEmail: string,
    areaName: string,

    name1: string,
    position1: string,
    isTrainer1: boolean,

    name2: string,
    position2: string,
    isTrainer2: boolean,

    name3: string,
    position3: string,
    isTrainer3: boolean,

    district: string,
    zone: string,

    unitString: string,
    hasMultipleUnits: boolean,
    languageString: string,

    isSeniorCouple: boolean,
    isSisterArea: boolean,

    hasVehicle?: boolean,
    vehicleMiles: string,
    vinLast8: string,

    aptAddress: string,
    areaID: string,
    phoneNumber: string,

    missionaryEmail1: string,
    missionaryEmail2: string,
    missionaryEmail3: string,

}