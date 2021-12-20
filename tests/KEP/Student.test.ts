import { studentEmailregex } from "../../src/tools/regexs";

describe("Student", () => {
    test("email", () => {
        const pf = (am: string) => am + "@uom.edu.gr";
        expect(pf("dai18001")).toMatch(studentEmailregex);
        expect(pf("dai1801")).not.toMatch(studentEmailregex);
        expect(pf("it2614")).not.toMatch(studentEmailregex);
    })
})
