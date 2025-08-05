import 'node:process';

export default function memoryUsage(){
    for (const [key,value] of Object.entries(process.memoryUsage())){
    console.log(`Memory usage by ${key}, ${value/1000000}MB `)
    }
};