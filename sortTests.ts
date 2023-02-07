function sortTests() {
    const array1:kiDataEntry[] = [
        { ki1: 45, ki2: 26, ki3: 31, ki4: "asodidn" },
        { ki1: 16, ki2: 9, ki3: 4, ki4: "sdfionsdiog" },
        { ki1: 21, ki2: 37, ki3: 0, ki4: "sodfisndifo" },
        { ki1: 41, ki2: 25, ki3: 50, ki4: "sdfionsdfioo" },
        { ki1: 20, ki2: 9, ki3: 1, ki4: "IONDFIOSDN" },
        { ki1: 17, ki2: 8, ki3: 1, ki4: "IODN" },
        { ki1: 11, ki2: 27, ki3: 39, ki4: "🤣" },
        { ki1: 0, ki2: 37, ki3: 9, ki4: "null" },
        { ki1: 46, ki2: 32, ki3: 26, ki4: "" },
        { ki1: 19, ki2: 15, ki3: 35, ki4: "ionsdf" },
        { ki1: 47, ki2: 0, ki3: 36, ki4: "aiosnd" },
        { ki1: 44, ki2: 28, ki3: 13, ki4: "eiinio" },
        { ki1: 8, ki2: 23, ki3: 13, ki4: "iodnone" },
        { ki1: 44, ki2: 34, ki3: 15, ki4: "oisnoDISFN" },
        { ki1: 0, ki2: 9, ki3: 45, ki4: "aa" },
        { ki1: 21, ki2: 44, ki3: 28, ki4: "aa" },
        { ki1: 35, ki2: 31, ki3: 27, ki4: "a a" },
    ]

    const sortByKi1_1: kiDataEntry[] = [
        { ki1:0, ki2: 37, ki3: 9, ki4: "null" },
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
    const outObj1 = class1.sort("ki1").end
    const outObj2 = class1.sort("ki2").end
    const outObj3 = class1.sort("ki3").end
    const outObj4 = class1.sort("ki4").end

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