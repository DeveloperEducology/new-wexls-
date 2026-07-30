const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb+srv://vjymrk:Admin_84529@cluster0.ivjiolu.mongodb.net/new-wexls?retryWrites=true&w=majority";

async function debugSession() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('new-wexls');
    const sessionId = '6a6b540bd95eea3bec8b5396';

    let session = await db.collection('test_sessions').findOne({ _id: new ObjectId(sessionId) });
    if (!session) {
      session = await db.collection('test_sessions').findOne({ $or: [{ id: sessionId }, { sessionId }] });
    }

    console.log('Session Found:', Boolean(session));
    if (session) {
      console.log('Session Keys:', Object.keys(session));
      console.log('TemplateId:', session.templateId);
      console.log('ExamId:', session.examId);
      console.log('Questions Length:', session.questions ? session.questions.length : 0);
      console.log('Report Present:', Boolean(session.report));
      if (session.report) {
        console.log('Report evaluatedAnswers length:', session.report.evaluatedAnswers ? session.report.evaluatedAnswers.length : 0);
        if (session.report.evaluatedAnswers && session.report.evaluatedAnswers.length > 0) {
          console.log('Sample evaluatedAnswer:', session.report.evaluatedAnswers[0]);
        }
      }
    } else {
      console.log('Listing last 5 test_sessions in DB:');
      const recent = await db.collection('test_sessions').find().sort({ startedAt: -1, _id: -1 }).limit(5).toArray();
      recent.forEach(s => console.log('Session ID:', s._id.toString(), 'Template:', s.templateId, 'Questions:', s.questions ? s.questions.length : 0));
    }
  } catch (err) {
    console.error('Debug error:', err);
  } finally {
    await client.close();
  }
}

debugSession();
