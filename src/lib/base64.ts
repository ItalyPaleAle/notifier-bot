const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_='

/*!
The MIT License (MIT)
Copyright (c) 2011 Jon Leighton
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Source: https://gist.github.com/jonleighton/958841

export function Encode(arrayBuffer: ArrayBuffer): string {
    let base64 = ''

    const bytes = new Uint8Array(arrayBuffer)
    const byteLength = bytes.byteLength
    const byteRemainder = byteLength % 3
    const mainLength = byteLength - byteRemainder

    let a, b, c, d
    let chunk

    for (var i = 0; i < mainLength; i = i + 3) {
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
        a = (chunk & 16515072) >> 18
        b = (chunk & 258048) >> 12
        c = (chunk & 4032) >> 6
        d = chunk & 63
        base64 += keyStr[a] + keyStr[b] + keyStr[c] + keyStr[d]
    }
    if (byteRemainder == 1) {
        chunk = bytes[mainLength]
        a = (chunk & 252) >> 2
        b = (chunk & 3) << 4
        base64 += keyStr[a] + keyStr[b] + '=='
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
        a = (chunk & 64512) >> 10
        b = (chunk & 1008) >> 4
        c = (chunk & 15) << 2
        base64 += keyStr[a] + keyStr[b] + keyStr[c] + '='
    }
    return base64
}

// Source: https://github.com/danguer/blog-examples/blob/master/js/base64-binary.js

/*!
Copyright (c) 2011, Daniel Guerrero
All rights reserved.
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL DANIEL GUERRERO BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Uses the new array typed in javascript to binary base64 encode/decode
 * at the moment just decodes a binary base64 encoded
 * into either an ArrayBuffer (decodeArrayBuffer)
 * or into an Uint8Array (decode)
 *
 * References:
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/Uint8Array
 */

export function DecodeArrayBuffer(input: string): ArrayBuffer {
    const bytes = (input.length / 4) * 3
    const ab = new ArrayBuffer(bytes)
    Decode(input, ab)
    return ab
}

function RemovePaddingChars(input: string): string {
    const paddingChar = keyStr.charAt(keyStr.length - 1)
    let end = input.length
    while (end > 0 && input.charAt(end - 1) == paddingChar) {
        --end
    }
    return input.substring(0, end)
}

export function Decode(input: string, arrayBuffer: ArrayBuffer) {
    input = RemovePaddingChars(input)

    const bytes = (input.length / 4) * 3

    let uarray
    let chr1, chr2, chr3
    let enc1, enc2, enc3, enc4
    let i = 0
    let j = 0

    if (arrayBuffer) {
        uarray = new Uint8Array(arrayBuffer)
    } else {
        uarray = new Uint8Array(bytes)
    }

    input = input.replace(/[^A-Za-z0-9\-_=]/g, '')

    for (i = 0; i < bytes; i += 3) {
        enc1 = keyStr.indexOf(input.charAt(j++))
        enc2 = keyStr.indexOf(input.charAt(j++))
        enc3 = keyStr.indexOf(input.charAt(j++))
        enc4 = keyStr.indexOf(input.charAt(j++))

        chr1 = (enc1 << 2) | (enc2 >> 4)
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
        chr3 = ((enc3 & 3) << 6) | enc4

        uarray[i] = chr1
        if (enc3 != 64) {
            uarray[i + 1] = chr2
        }
        if (enc4 != 64) {
            uarray[i + 2] = chr3
        }
    }

    return uarray
}
