-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "conversationId" INTEGER;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
