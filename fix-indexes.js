const mongoose = require('mongoose');

async function fixIndexes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/study_together');
    const db = mongoose.connection.db;

    console.log('🔧 Fixing GroupMembers indexes...');
    try {
      await db.collection('groupmembers').dropIndex('group_id_1_user_id_1');
      console.log('  ✅ Dropped old index group_id_1_user_id_1');
    } catch (e) {
      console.log('  ⚠️ ' + e.message);
    }
    await db.collection('groupmembers').createIndex(
      { group_id: 1, user_id: 1 },
      { unique: true, sparse: true, name: 'group_id_1_user_id_1_sparse' }
    );
    console.log('  ✅ Created sparse index group_id_1_user_id_1_sparse');

    console.log('\n🔧 Fixing Attendances indexes...');
    try {
      await db.collection('attendances').dropIndex('user_id_1_slot_id_1');
      console.log('  ✅ Dropped old index user_id_1_slot_id_1');
    } catch (e) {
      console.log('  ⚠️ ' + e.message);
    }
    await db.collection('attendances').createIndex(
      { user_id: 1, slot_id: 1 },
      { unique: true, sparse: true, name: 'user_id_1_slot_id_1_sparse' }
    );
    console.log('  ✅ Created sparse index user_id_1_slot_id_1_sparse');

    console.log('\n� Fixing ChatParticipants indexes...');
    try {
      await db.collection('chatparticipants').dropIndex('chat_id_1_user_id_1');
      console.log('  ✅ Dropped old index chat_id_1_user_id_1');
    } catch (e) {
      console.log('  ⚠️ ' + e.message);
    }
    await db.collection('chatparticipants').createIndex(
      { chat_id: 1, user_id: 1 },
      { unique: true, sparse: true, name: 'chat_id_1_user_id_1_sparse' }
    );
    console.log('  ✅ Created sparse index chat_id_1_user_id_1_sparse');

    console.log('\n�📋 Listing all indexes...');
    
    console.log('\nGroupMembers indexes:');
    const gmIndexes = await db.collection('groupmembers').indexes();
    gmIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''} ${idx.sparse ? '(sparse)' : ''}`);
    });

    console.log('\nAttendances indexes:');
    const attIndexes = await db.collection('attendances').indexes();
    attIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''} ${idx.sparse ? '(sparse)' : ''}`);
    });

    console.log('\nChatParticipants indexes:');
    const cpIndexes = await db.collection('chatparticipants').indexes();
    cpIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''} ${idx.sparse ? '(sparse)' : ''}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done! All indexes fixed.');
  } catch (err) {
    console.error('❌ Error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixIndexes();
