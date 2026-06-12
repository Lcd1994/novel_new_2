import Sidebar from '@/components/layout/Sidebar';
import AIDiscussionRoom from '@/components/studio/AIDiscussionRoom';

export default function Discussion() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1">
        <AIDiscussionRoom />
      </div>
    </div>
  );
}
