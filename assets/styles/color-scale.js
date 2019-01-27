import chroma from 'chroma-js';

const scale = chroma.scale([
    '#FF851B',
    '#FF4136'
]);

export default function(weight) {
    return scale(weight / 100).rgba();
}