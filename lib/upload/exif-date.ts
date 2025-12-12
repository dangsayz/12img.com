/**
 * EXIF Date Extraction
 * 
 * Lightweight EXIF parser that extracts DateTimeOriginal from JPEG files.
 * This is the key to sorting photos by capture time (like Pixieset does).
 * 
 * EXIF DateTimeOriginal (tag 0x9003) is set by the camera when the photo
 * is taken, preserving chronological order regardless of filename.
 */

/**
 * Extract the capture date from a JPEG file's EXIF data.
 * Returns null if no EXIF date is found.
 */
export async function getExifDate(file: File): Promise<Date | null> {
  // Only JPEG files have EXIF
  if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
    return null
  }

  try {
    // Read first 128KB - EXIF is always at the start
    const buffer = await file.slice(0, 128 * 1024).arrayBuffer()
    const view = new DataView(buffer)
    
    // Check for JPEG SOI marker
    if (view.getUint16(0) !== 0xFFD8) {
      return null
    }

    // Find EXIF APP1 marker
    let offset = 2
    while (offset < view.byteLength - 4) {
      const marker = view.getUint16(offset)
      
      // APP1 marker (EXIF)
      if (marker === 0xFFE1) {
        const length = view.getUint16(offset + 2)
        
        // Check for "Exif\0\0" identifier
        const exifId = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7)
        )
        
        if (exifId === 'Exif') {
          const tiffOffset = offset + 10 // Start of TIFF header
          return parseTiffHeader(view, tiffOffset)
        }
      }
      
      // Skip to next marker
      if ((marker & 0xFF00) === 0xFF00) {
        const segmentLength = view.getUint16(offset + 2)
        offset += 2 + segmentLength
      } else {
        offset++
      }
    }
    
    return null
  } catch (e) {
    console.warn('[EXIF] Failed to parse:', file.name, e)
    return null
  }
}

/**
 * Parse TIFF header and find DateTimeOriginal
 */
function parseTiffHeader(view: DataView, tiffOffset: number): Date | null {
  // Check byte order (II = little endian, MM = big endian)
  const byteOrder = view.getUint16(tiffOffset)
  const isLittleEndian = byteOrder === 0x4949 // "II"
  
  // Verify TIFF magic number (42)
  const magic = view.getUint16(tiffOffset + 2, isLittleEndian)
  if (magic !== 42) return null
  
  // Get IFD0 offset
  const ifd0Offset = view.getUint32(tiffOffset + 4, isLittleEndian)
  
  // Parse IFD0 to find EXIF IFD pointer
  const exifIfdPointer = findTagValue(view, tiffOffset, ifd0Offset, 0x8769, isLittleEndian)
  
  if (exifIfdPointer) {
    // Parse EXIF IFD for DateTimeOriginal (0x9003)
    const dateTimeOriginal = findDateTimeTag(view, tiffOffset, exifIfdPointer, 0x9003, isLittleEndian)
    if (dateTimeOriginal) return dateTimeOriginal
    
    // Fallback to DateTimeDigitized (0x9004)
    const dateTimeDigitized = findDateTimeTag(view, tiffOffset, exifIfdPointer, 0x9004, isLittleEndian)
    if (dateTimeDigitized) return dateTimeDigitized
  }
  
  // Fallback to DateTime (0x0132) in IFD0
  const dateTime = findDateTimeTag(view, tiffOffset, ifd0Offset, 0x0132, isLittleEndian)
  if (dateTime) return dateTime
  
  return null
}

/**
 * Find a tag value in an IFD
 */
function findTagValue(
  view: DataView,
  tiffOffset: number,
  ifdOffset: number,
  targetTag: number,
  isLittleEndian: boolean
): number | null {
  try {
    const entryCount = view.getUint16(tiffOffset + ifdOffset, isLittleEndian)
    
    for (let i = 0; i < entryCount; i++) {
      const entryOffset = tiffOffset + ifdOffset + 2 + (i * 12)
      const tag = view.getUint16(entryOffset, isLittleEndian)
      
      if (tag === targetTag) {
        // For pointer tags, value is stored in the value/offset field
        return view.getUint32(entryOffset + 8, isLittleEndian)
      }
    }
  } catch (e) {
    // Out of bounds
  }
  return null
}

/**
 * Find and parse a DateTime tag
 * EXIF datetime format: "YYYY:MM:DD HH:MM:SS"
 */
function findDateTimeTag(
  view: DataView,
  tiffOffset: number,
  ifdOffset: number,
  targetTag: number,
  isLittleEndian: boolean
): Date | null {
  try {
    const entryCount = view.getUint16(tiffOffset + ifdOffset, isLittleEndian)
    
    for (let i = 0; i < entryCount; i++) {
      const entryOffset = tiffOffset + ifdOffset + 2 + (i * 12)
      const tag = view.getUint16(entryOffset, isLittleEndian)
      
      if (tag === targetTag) {
        const type = view.getUint16(entryOffset + 2, isLittleEndian)
        const count = view.getUint32(entryOffset + 4, isLittleEndian)
        
        // DateTime is ASCII string (type 2), 20 bytes including null terminator
        if (type === 2 && count === 20) {
          const valueOffset = view.getUint32(entryOffset + 8, isLittleEndian)
          const stringOffset = tiffOffset + valueOffset
          
          // Read the datetime string
          let dateStr = ''
          for (let j = 0; j < 19; j++) {
            dateStr += String.fromCharCode(view.getUint8(stringOffset + j))
          }
          
          // Parse "YYYY:MM:DD HH:MM:SS"
          return parseExifDateTime(dateStr)
        }
      }
    }
  } catch (e) {
    // Out of bounds
  }
  return null
}

/**
 * Parse EXIF datetime string to Date object
 * Format: "YYYY:MM:DD HH:MM:SS"
 */
function parseExifDateTime(str: string): Date | null {
  // Format: "2024:12:11 14:30:45"
  const match = str.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
  if (!match) return null
  
  const [, year, month, day, hour, minute, second] = match
  
  // Month is 0-indexed in JavaScript Date
  const date = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  )
  
  // Validate the date
  if (isNaN(date.getTime())) return null
  
  return date
}

/**
 * Batch extract EXIF dates from multiple files
 * Returns a Map of file -> Date (or null if no date)
 */
export async function getExifDates(files: File[]): Promise<Map<File, Date | null>> {
  const results = new Map<File, Date | null>()
  
  // Process in parallel with concurrency limit
  const CONCURRENCY = 8
  const queue = [...files]
  const executing: Promise<void>[] = []
  
  while (queue.length > 0 || executing.length > 0) {
    while (executing.length < CONCURRENCY && queue.length > 0) {
      const file = queue.shift()!
      const promise = getExifDate(file)
        .then(date => {
          results.set(file, date)
        })
        .catch(() => {
          results.set(file, null)
        })
      
      executing.push(promise.then(() => {
        const idx = executing.indexOf(promise as any)
        if (idx >= 0) executing.splice(idx, 1)
      }) as any)
    }
    
    if (executing.length > 0) {
      await Promise.race(executing)
    }
  }
  
  return results
}

/**
 * Sort files by EXIF capture date, falling back to filename for files without dates
 * This preserves the chronological order of photos from an event
 */
export async function sortFilesByExifDate(files: File[]): Promise<File[]> {
  const dates = await getExifDates(files)
  
  return [...files].sort((a, b) => {
    const dateA = dates.get(a)
    const dateB = dates.get(b)
    
    // Both have dates - sort chronologically
    if (dateA && dateB) {
      return dateA.getTime() - dateB.getTime()
    }
    
    // Only one has a date - files with dates come first
    if (dateA && !dateB) return -1
    if (!dateA && dateB) return 1
    
    // Neither has date - fall back to natural filename sort
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  })
}
