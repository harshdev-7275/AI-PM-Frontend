import { type ReactNode } from 'react'
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  Users,
  BarChart3,
  Zap,
} from 'lucide-react'

function BentoGrid() {
  return (
    <div className="w-full h-full p-4 overflow-hidden">
      <div className="grid grid-cols-3 grid-rows-4 gap-4 w-full h-full">
        {/* Manage — brand card */}
        <div className="col-span-1 row-span-1 rounded-3xl bg-brand-primary p-5 flex flex-col justify-between">
          <span className="text-white text-sm font-semibold">Manage</span>
          <LayoutDashboard className="text-white" size={24} />
        </div>

        {/* Image placeholder 1 */}
        <div className="col-span-1 row-span-1 rounded-3xl bg-brand-primary/10 overflow-hidden flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&h=300&fit=crop&crop=faces"
            alt="Team collaborating"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Fast card */}
        <div className="col-span-1 row-span-1 rounded-3xl bg-card ring-1 ring-border p-5 flex flex-col justify-between">
          <Zap className="text-white" size={24} />
          <span className="text-white text-sm font-semibold">Fast</span>
        </div>

        {/* Image placeholder 2 */}
        <div className="col-span-1 row-span-1 rounded-3xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=300&h=300&fit=crop&crop=faces"
            alt="Team meeting"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Communicate — gray card */}
        <div className="col-span-1 row-span-1 rounded-3xl bg-zinc-800 p-5 flex flex-col justify-between">
          <MessageSquare className="text-white" size={24} />
          <span className="text-white text-sm font-semibold">Communicate</span>
        </div>

        {/* Image placeholder 3 */}
        <div className="col-span-1 row-span-1 rounded-3xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&h=300&fit=crop&crop=faces"
            alt="Professional at work"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Task card — brand */}
        <div className="col-span-1 row-span-1 rounded-3xl bg-brand-primary p-5 flex flex-col justify-between">
          <CheckSquare className="text-white" size={24} />
          <span className="text-white text-sm font-semibold">Tasks</span>
        </div>

        {/* Team card */}
        <div className="col-span-1 row-span-1 rounded-3xl bg-card ring-1 ring-border p-5 flex flex-col justify-between">
          <Users className="text-white" size={24} />
          <span className="text-white text-sm font-semibold">Collaborate</span>
        </div>

        {/* Image placeholder 4 */}
        <div className="col-span-1 row-span-1 rounded-3xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=300&h=300&fit=crop&crop=faces"
            alt="Team working together"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Image placeholder 5 */}
        <div className="col-span-1 row-span-1 rounded-3xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=300&fit=crop&crop=faces"
            alt="Team planning"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Analytics — gray card */}
        <div className="col-span-1 row-span-1 rounded-3xl bg-zinc-800 p-5 flex flex-col justify-between">
          <BarChart3 className="text-white" size={24} />
          <span className="text-white text-sm font-semibold">Analytics</span>
        </div>

        {/* Brand logo card */}
        <div className="col-span-1 row-span-1 rounded-3xl bg-brand-primary p-5 flex items-center justify-center">
          <span className="text-white font-bold text-lg tracking-wider">Planiqo</span>
        </div>
      </div>
    </div>
  )
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left panel — form */}
      <div className="flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto bg-background">
        {/* Brand name */}
        <span className="text-xl font-bold tracking-tight text-foreground shrink-0 block overflow-visible py-1">Planiqo</span>

        {/* Form centered */}
        <div className="flex-1 flex items-center justify-center">
          {children}
        </div>
      </div>

      {/* Right brand panel — bento grid */}
      <div
        aria-label="Brand panel"
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-background"
      >
        <BentoGrid />
      </div>
    </div>
  )
}
