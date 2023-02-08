function sortTests() {
    const array1:kiDataEntry[] = [
        { ki1:0, ki2: 37, ki3: 9, ki4: null ,dateComp:"3/21/2023"},
        { ki1: 0, ki2: 9, ki3: 45, ki4: "aa" , dateComp: "12/30/2022"},
        { ki1: 11, ki2: 27, ki3: 39, ki4: "🤣" , dateComp: "2/16/2023"},
        { ki1: 16, ki2: 9, ki3: 4, ki4: "sdfionsdiog" , dateComp: "6/07/2023"},
        { ki1: 17, ki2: 8, ki3: 1, ki4: "IODN" , dateComp: "3/16/2023"},
        { ki1: 19, ki2: 15, ki3: 35, ki4: "ionsdf" , dateComp: "5/12/2023"},
        { ki1: 20, ki2: 9, ki3: 1, ki4: "IONDFIOSDN" , dateComp: "6/10/2023"},
        { ki1: 21, ki2: 37, ki3: 0, ki4: "sodfisndifo" , dateComp: "2/12/2023"},
        { ki1: 21, ki2: 44, ki3: 28, ki4: "aa" , dateComp: "2/08/2023"},
        { ki1: 35, ki2: 31, ki3: 27, ki4: "a a" , dateComp: "1/03/2023"},
        { ki1: 41, ki2: 25, ki3: 50, ki4: "sdfionsdfioo" , dateComp: "4/09/2023"},
        { ki1: 44, ki2: 28, ki3: 13, ki4: "eiinio" , dateComp: "6/13/2023"},
        { ki1: 44, ki2: 34, ki3: 15, ki4: "oisnoDISFN" , dateComp: "3/16/2023"},
        { ki1: 45, ki2: 26, ki3: 31, ki4: "asodidn" , dateComp: "6/11/2023"},
        { ki1: 46, ki2: 32, ki3: 26, ki4: "" , dateComp: "12/11/2022"},
        { ki1: 47, ki2: 0, ki3: 36, ki4: "aiosnd" , dateComp: "3/02/2023"},
        { ki1: null, ki2: 23, ki3: 13, ki4: "iodnone" , dateComp:"5/29/2023"}				

    ]

    const sortByKi1_1: kiDataEntry[] = [
        { ki1:0, ki2: 7, ki3: 9, ki4: "null" },
        { ki1: 0, ki2: 9, ki3: 45, ki4: "aa" },
        { ki1: 8, ki2: 23, ki3: 13, ki4: "iodnone" },
        { ki1: 11, ki2: 27, ki3: 39, ki4: "🤣" },
        { ki1: 16, ki2: 9, ki3: 4, ki4: "sdfionsdiog" },
        { ki1: 17, ki2: 8, ki3: 1, ki4: "IODN" },
        { ki1: 19, ki2: 15, ki3: 35, ki4: "ionsdf" },
        { ki1: 20, ki2: 9, ki3: 1, ki4: "IONDFIOSDN" },
        { ki1: 21, ki2: 37, ki3: 0, ki4: "sodfisndifo" },
        { ki1: 21, ki2: 44, ki3: 28, ki4: "aa" },
        { ki1: 35, ki2: 31, ki3: 27, ki4: "aa" },
        { ki1: 41, ki2: 25, ki3: 50, ki4: "sdfionsdfioo" },
        { ki1: 44, ki2: 28, ki3: 13, ki4: "eiinio" },
        { ki1: 44, ki2: 34, ki3: 15, ki4: "oisnoDISFN" },
        { ki1: 45, ki2: 26, ki3: 31, ki4: "asodidn" },
        { ki1: 46, ki2: 32, ki3: 26, ki4: "" },
        { ki1: 47, ki2: 0, ki3: 36, ki4: "aiosnd" }, 				
    ]

    const class1 = new kiDataClass(array1)
    let sortArgs: sortArgs = {
        valueType: sortTypes.integer,
        descending: true
    }
    const outObj1 = class1.sort("ki1", sortArgs).end
    console.log("ob1: "+outObj1.length,array1.length)
    console.log(class1.getDataFromKey("ki1"))
    sortArgs.valueType = sortTypes.string
    const outObj2 = class1.sort("ki2",sortArgs).end
    console.log(class1.getDataFromKey("ki2"));
    sortArgs.valueType = sortTypes.integer
    sortArgs.descending = false
    const outObj3 = class1.sort("ki3", sortArgs).end
    console.log(class1.getDataFromKey("ki3"));
    sortArgs.valueType = sortTypes.date;
    // sortArgs.descending = false
    const outObj4 = class1.sort("dateComp", sortArgs).end
    console.log(class1.getDataFromKey("dateComp"));
    // sortArgs.valueType = sortTypes.integer;
    // sortArgs.descending = false

    console.log(outObj1)
    console.log(outObj2)
    console.log(outObj3)
    console.log(outObj4)

    console.log("Tests completed!")
}

function compareKiDataEntryArrays_(obj1:kiDataEntry[], obj2:kiDataEntry) {
    let length = obj1.length
    if (obj2.length > length) { length = obj2.length; }
    for (let i = 0; i > length; i++) {
        if (obj1.length < i || obj2.length < i) {
            console.log("mismatched sizes!");
        } else {
            for (let key in obj1[i]) {
                
            }
        }
    }
    
}