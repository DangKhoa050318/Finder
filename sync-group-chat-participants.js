const mongoose = require('mongoose');

async function syncGroupChatParticipants() {
  try {
    await mongoose.connect('mongodb://localhost:27017/study_together');
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get all group chats
    const groupChats = await db.collection('chats').find({ chat_type: 'group' }).toArray();
    console.log(`Found ${groupChats.length} group chats\n`);

    let totalAdded = 0;
    let totalSkipped = 0;

    for (const chat of groupChats) {
      console.log(`\n📋 Processing chat for group: ${chat.group_id}`);

      // Get all members of this group
      const groupMembers = await db.collection('groupmembers')
        .find({ group_id: chat.group_id })
        .toArray();

      console.log(`  Found ${groupMembers.length} group members`);

      // Get current chat participants
      const currentParticipants = await db.collection('chatparticipants')
        .find({ chat_id: chat._id })
        .toArray();

      const currentParticipantIds = currentParticipants.map(p => p.user_id.toString());
      console.log(`  Current chat participants: ${currentParticipants.length}`);

      // Find members not in chat
      const missingMembers = groupMembers.filter(
        member => !currentParticipantIds.includes(member.user_id.toString())
      );

      if (missingMembers.length === 0) {
        console.log(`  ✓ All members already in chat`);
        totalSkipped += groupMembers.length;
        continue;
      }

      console.log(`  ⚠ ${missingMembers.length} members missing from chat`);

      // Add missing members to chat
      const participantsToAdd = missingMembers.map(member => ({
        chat_id: chat._id,
        user_id: member.user_id,
      }));

      if (participantsToAdd.length > 0) {
        await db.collection('chatparticipants').insertMany(participantsToAdd);
        console.log(`  ✅ Added ${participantsToAdd.length} members to chat`);
        totalAdded += participantsToAdd.length;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Sync completed!');
    console.log(`   Total added: ${totalAdded}`);
    console.log(`   Total already synced: ${totalSkipped}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

syncGroupChatParticipants();
