import fs from 'fs';
import path from 'path';

/**
 * Reads crime data from stored csv file.
 * @author Will Zhao
 * @returns {{lat: number, long: number, injured: number, killed: number}[]}
 */
export default function() {
    const text = fs.readFileSync(
        path.resolve('./src/data/texas.csv'),
        'utf8'
    );

    const data = text.split('\n').map(x => {
        let data = x.split(',');
        return {
            lat: parseFloat(data[0]),
            long: parseFloat(data[1]),
            injured: parseInt(data[2]),
            killed: parseInt(data[3]) 
        };
    });

    return data;
}