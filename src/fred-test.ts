// compile/transpile with tsc src/fred-test.ts --outfile dist/fred-test.js

class Student {
    fullName: string;
    constructor(public firstName: string, public middleInitial: string, public lastName: string) {
        this.fullName = firstName + " " + middleInitial + " " + lastName;
    }
}

interface Person {
    firstName: string;
    lastName: string;
}

function greeter(person : Person) {
    return "Bonjour, " + person.firstName + " " + person.lastName;
}

