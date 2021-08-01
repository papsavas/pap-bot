import { getTableNames } from "../src/DB/GenericCRUD";

describe('describe outer text', () => {
    describe('describe inner text', () => {
        test('first test 1+1=2', async () => {
            expect.assertions(1);
            getTableNames().then(names =>
                expect(names).toBe(['aaa']));
        })

    })
})
