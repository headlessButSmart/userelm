import { RoomProvider } from '@/contexts/RoomContext'
import { Sidebar } from '@/components/crm/Sidebar'
import { ChatLauncher } from '@/components/chat/ChatLauncher'

async function getWorkspaceName(roomId: string): Promise<string> {
  try {
    const res = await fetch(
      `${process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'}/api/rooms/${roomId}`,
      { cache: 'no-store' },
    )
    const data = await res.json()
    return data.workspaceName ?? 'Workspace'
  } catch {
    return 'Workspace'
  }
}

export default async function RoomLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  const workspaceName = await getWorkspaceName(roomId)

  return (
    <RoomProvider roomId={roomId} workspaceName={workspaceName}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">{children}</div>
      </div>
      <ChatLauncher />
    </RoomProvider>
  )
}
