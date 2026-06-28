import Icon from './Icon'

interface WelcomeBannerProps {
  name?: string
  newOrders?: number
  revenue?: string
}

export default function WelcomeBanner({ name = 'Manager Profile', newOrders = 12, revenue = '$4.2K' }: WelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#064e3b] to-[#065f46] p-8 rounded-2xl border border-primary/20">
      <div className="relative z-10 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Welcome back, {name}</h2>
          <p className="text-emerald-100/80 text-sm">
            You have <span className="font-bold text-white">{newOrders} new orders</span> and{' '}
            <span className="font-bold text-white">{revenue} revenue</span> today
          </p>
        </div>
        <button className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all backdrop-blur-md shrink-0">
          View Analytics <Icon name="ri-arrow-right-line" className="text-sm" />
        </button>
      </div>
    </div>
  )
}
