var SWF_COMPRESSED_TYPES = [
    'CWS',
    'FWS',
    'ZWS'
];

export default isSWF (buffer) {
    var compressedType = buffer.toString('ascii', 0, 3);

    if (SWF_COMPRESSED_TYPES.indexOf(compressedType) === -1)
        return false;


}
