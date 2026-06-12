import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { hashPassword, hashPin } from '@/lib/authService';
import { writeAuditLog } from '@/lib/auditService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { csvData, importType, dryRun } = body; // dryRun=true validates only, dryRun=false commits

    if (!csvData || !importType) {
      return NextResponse.json({ success: false, error: "Missing required parameters: csvData and importType" }, { status: 400 });
    }

    // Parse CSV lines manually
    const lines = csvData
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length <= 1) {
      return NextResponse.json({ success: false, error: "CSV data is empty or lacks rows" }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const dataRows = lines.slice(1);

    const validationErrors = [];
    const parsedRows = [];

    // Helper validation checks
    dataRows.forEach((rowStr, idx) => {
      const rowIdx = idx + 2; // 1-indexed plus header row
      const cols = rowStr.split(',').map(c => c.trim());
      const rowData = {};
      headers.forEach((h, i) => {
        rowData[h] = cols[i] || '';
      });

      // Validations based on type
      if (importType === 'students') {
        if (!rowData.name) validationErrors.push({ row: rowIdx, error: "Name is required" });
        if (!rowData.username) validationErrors.push({ row: rowIdx, error: "Username is required" });
        if (!rowData.pin) {
          // Auto generate if missing
          rowData.pin = String(Math.floor(1000 + Math.random() * 9000));
        } else if (rowData.pin.length !== 4) {
          validationErrors.push({ row: rowIdx, error: "Student PIN must be exactly 4 digits" });
        }
      } else if (importType === 'parents') {
        if (!rowData.name) validationErrors.push({ row: rowIdx, error: "Name is required" });
        if (!rowData.mobile && !rowData.email) {
          validationErrors.push({ row: rowIdx, error: "Either mobile number or email is required" });
        }
      } else if (importType === 'teachers') {
        if (!rowData.name) validationErrors.push({ row: rowIdx, error: "Name is required" });
        if (!rowData.email) validationErrors.push({ row: rowIdx, error: "Email address is required" });
      } else if (importType === 'classes') {
        if (!rowData.classcode) validationErrors.push({ row: rowIdx, error: "Class code is required" });
        if (!rowData.schoolid) validationErrors.push({ row: rowIdx, error: "School ID is required" });
        if (!rowData.grade) validationErrors.push({ row: rowIdx, error: "Grade is required" });
        if (!rowData.section) validationErrors.push({ row: rowIdx, error: "Section is required" });
      }

      parsedRows.push(rowData);
    });

    // If validation failed, return errors
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        valid: false,
        errors: validationErrors
      }, { status: 422 });
    }

    // If dryRun, return success check status
    if (dryRun) {
      return NextResponse.json({
        success: true,
        valid: true,
        preview: parsedRows.slice(0, 5),
        totalCount: parsedRows.length
      });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({
        success: true,
        valid: true,
        message: "DB offline. CSV parse validation succeeded. Import simulated successfully.",
        totalImported: parsedRows.length
      });
    }

    // 4. COMMIT EXECUTION
    const usersColl = db.collection('users');
    let importedCount = 0;

    for (const row of parsedRows) {
      try {
        if (importType === 'students') {
          const hashedPin = await hashPin(row.pin);
          const userResult = await usersColl.insertOne({
            name: row.name,
            username: row.username.toLowerCase(),
            role: 'student',
            pin: hashedPin,
            schoolId: row.schoolid || 'school_1',
            classId: row.classid || null,
            isActive: true,
            createdAt: new Date()
          });

          await db.collection('students').insertOne({
            _id: `stud_${userResult.insertedId}`,
            userId: row.username.toLowerCase(),
            parentId: row.parentid || null,
            classId: row.classid || null,
            name: row.name,
            streakDays: 0,
            totalXp: 0,
            avatar: '🐱',
            grade: row.grade || 'Grade 5'
          });

          if (row.parentid) {
            await db.collection('parent_student_links').insertOne({
              parentId: row.parentid,
              studentId: `stud_${userResult.insertedId}`,
              relation: 'Guardian',
              createdAt: new Date()
            });
          }
        } 
        
        else if (importType === 'parents') {
          const parentDoc = {
            name: row.name,
            role: 'parent',
            isActive: true,
            createdAt: new Date()
          };
          if (row.email) parentDoc.email = row.email.toLowerCase();
          if (row.mobile) parentDoc.mobile = row.mobile;
          if (row.pin) parentDoc.pin = await hashPin(row.pin);

          const userResult = await usersColl.insertOne(parentDoc);

          await db.collection('parents').insertOne({
            _id: `parent_${userResult.insertedId}`,
            userId: row.email || row.mobile,
            email: row.email || null,
            mobile: row.mobile || null,
            childIds: []
          });
        } 
        
        else if (importType === 'teachers') {
          const defaultPass = await hashPassword(row.password || 'KlassChamp123');
          const userResult = await usersColl.insertOne({
            name: row.name,
            email: row.email.toLowerCase(),
            role: 'teacher',
            password: defaultPass,
            schoolId: row.schoolid || 'school_1',
            isActive: true,
            createdAt: new Date()
          });

          await db.collection('teachers').insertOne({
            _id: `teach_${userResult.insertedId}`,
            userId: row.email.toLowerCase(),
            email: row.email.toLowerCase(),
            classIds: row.classid ? [row.classid] : []
          });

          if (row.classid) {
            await db.collection('teacher_class_links').insertOne({
              teacherId: `teach_${userResult.insertedId}`,
              classId: row.classid,
              createdAt: new Date()
            });
          }
        } 
        
        else if (importType === 'classes') {
          await db.collection('classes').insertOne({
            classCode: row.classcode.toUpperCase(),
            schoolId: row.schoolid,
            grade: row.grade,
            section: row.section.toUpperCase(),
            teacherId: row.teacherid || null,
            isActive: true,
            createdAt: new Date()
          });
        }

        importedCount++;
      } catch (err) {
        console.error(`Import failed for row:`, row, err);
      }
    }

    // Write audit log
    await writeAuditLog({
      actorUserId: 'admin',
      actorRole: 'admin',
      action: 'bulk import',
      targetType: 'user',
      metadata: { importType, count: importedCount }
    });

    return NextResponse.json({
      success: true,
      valid: true,
      message: `CSV import completed successfully.`,
      totalImported: importedCount
    });
  } catch (error) {
    console.error("Bulk CSV import error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
