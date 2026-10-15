/* COMEX Head display pages — Figma Frames 9, 10, 11, 11.12 and 12.
 * Display only: nothing on these pages can be changed. */
import { Calendar, Clock, Filter, Send, CircleCheck, Eye, PenLine } from 'lucide-react'
import { DisplayButton, DisplayFilter, DisplaySearch } from '../../components/DashboardControls'
import {
  DepartmentPanel,
  FakeSelect,
  NavyButton,
  PageTitle,
  Tabs,
  YellowButton,
} from '../../components/Showcase'

/** Frame 10 — Project Proposals. */
export function AdminProjects() {
  return (
    <>
      <PageTitle>Project Proposals</PageTitle>
      <div className="mb-6 flex flex-wrap gap-3">
        <DisplaySearch placeholder="Search by project title or project lead" className="min-w-56 flex-1" />
        <DisplayFilter>A.Y. 2025-2026</DisplayFilter>
        <DisplayFilter>All departments</DisplayFilter>
      </div>
      <div className="space-y-8">
        <DepartmentPanel title="School of Engineering and Technology (SET)" open>
          <Tabs items={['New', 'Ongoing', 'Done']} />
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="font-medium">E-Gabay Learning Hub</p>
              <p className="text-sm text-gray-700">It is a literacy and skills development program</p>
              <p className="mt-2 flex gap-8 text-[11px] text-gray-600">
                <span>Maria Santos</span>
                <span>Step 1</span>
              </p>
            </div>
            <YellowButton className="!px-2 !py-1 text-[11px]">View Status</YellowButton>
          </div>
        </DepartmentPanel>
        <DepartmentPanel title="School of Business Administration (SBA)" />
      </div>
    </>
  )
}

