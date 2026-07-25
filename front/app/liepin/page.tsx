'use client'

import { useState, useEffect } from 'react'
import { createSSEWithBackoff } from '@/lib/sse'
import { BiSearch, BiSave, BiPlay, BiStop, BiLogOut, BiBriefcase, BiTrash, BiPlus } from 'react-icons/bi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AnalysisContent from '@/app/liepin/analysis/AnalysisContent'
import PageHeader from '@/app/components/PageHeader'

interface LiepinConfig {
  id?: number
  debugger?: number
  waitTime?: number
  keywords?: string
  city?: string
  salaryCode?: string
  degree?: string
  experience?: string
  filterDeadHr?: number
}

interface LiepinOption { id: number; type: string; name: string; code: string }
interface LiepinOptions { city: LiepinOption[] }
interface BlacklistItem { id: number; value: string; type: string }

export default function LiepinPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isDelivering, setIsDelivering] = useState(false)
  const [checkingLogin, setCheckingLogin] = useState(true)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showLogoutResultDialog, setShowLogoutResultDialog] = useState(false)
  const [logoutResult, setLogoutResult] = useState<{ success: boolean; message: string } | null>(null)
  const [backendAvailable, setBackendAvailable] = useState(true)

  const [config, setConfig] = useState<LiepinConfig>({
    keywords: '', city: '', salaryCode: '', degree: '', experience: '',
    filterDeadHr: 0,
  })
  const [options, setOptions] = useState<LiepinOptions>({ city: [] })
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([])
  const [newBlacklistKeyword, setNewBlacklistKeyword] = useState('')
  const [blacklistType, setBlacklistType] = useState('company')

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      setCheckingLogin(false); return
    }
    const client = createSSEWithBackoff('http://localhost:8888/api/jobs/login-status/stream', {
      onOpen: () => {},
      onError: (e, attempt, delay) => { setCheckingLogin(false) },
      listeners: [
        { name: 'connected', handler: (event) => { try { const d = JSON.parse(event.data); setIsLoggedIn(d.liepinLoggedIn || false); setCheckingLogin(false) } catch(e) {} } },
        { name: 'login-status', handler: (event) => { try { const d = JSON.parse(event.data); if (d.platform === 'liepin') { setIsLoggedIn(d.isLoggedIn); setCheckingLogin(false) } } catch(e) {} } },
        { name: 'ping', handler: () => {} },
      ],
    })
    return () => { client.close() }
  }, [])

  useEffect(() => { fetchConfig() }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('http://localhost:8888/api/liepin/config')
      const data = await res.json()
      if (data.config) setConfig(prev => ({ ...prev, ...data.config }))
      if (data.options) setOptions(data.options)
      if (data.blacklist) setBlacklist(data.blacklist)
    } catch(e) { setBackendAvailable(false) }
    finally { setLoadingConfig(false) }
  }

  const handleSave = async () => {
    try {
      const res = await fetch('http://localhost:8888/api/liepin/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) })
      if (res.ok) {
        try { await fetch('http://localhost:8888/api/cookie/save?platform=liepin', { method: 'POST' }) } catch(e) {}
        setSaveResult({ success: true, message: '保存成功' }); setShowSaveDialog(true); fetchConfig()
      } else { setSaveResult({ success: false, message: '保存失败' }); setShowSaveDialog(true) }
    } catch(e) { setSaveResult({ success: false, message: '网络异常' }); setShowSaveDialog(true) }
  }

  const handleAddBlacklist = async () => {
    if (!newBlacklistKeyword.trim()) return
    try {
      await fetch('http://localhost:8888/api/liepin/config/blacklist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: newBlacklistKeyword, type: blacklistType }) })
      setNewBlacklistKeyword(''); fetchConfig()
    } catch(e) {}
  }

  const handleDeleteBlacklist = async (id: number) => {
    try { await fetch(`http://localhost:8888/api/liepin/config/blacklist/${id}`, { method: 'DELETE' }); fetchConfig() } catch(e) {}
  }

  const handleStartDelivery = async () => { try { setIsDelivering(true); await fetch('http://localhost:8888/api/liepin/start', { method: 'POST' }) } catch(e) { setIsDelivering(false) } }
  const handleStopDelivery = async () => { try { await fetch('http://localhost:8888/api/liepin/stop', { method: 'POST' }); setIsDelivering(false) } catch(e) { setIsDelivering(false) } }

  const triggerLogout = async () => {
    try {
      const res = await fetch('http://localhost:8888/api/liepin/logout', { method: 'POST' })
      const data = await res.json()
      if (data.success) { setIsLoggedIn(false); setIsDelivering(false); setLogoutResult({ success: true, message: '已退出' }) }
      else { setLogoutResult({ success: false, message: data.message || '失败' }) }
    } catch(e) { setLogoutResult({ success: false, message: '网络异常' }) }
    setShowLogoutResultDialog(true)
  }

  if (loadingConfig) return <div className="flex items-center justify-center h-screen">加载中...</div>

  const salaryOptions = ['不限','3k-5k','5k-8k','8k-10k','10k-15k','15k-20k','20k-30k','30k-50k','50k以上']
  const degreeOptions = ['不限','大专','本科','硕士','博士']
  const expOptions = ['不限','应届','1-3年','3-5年','5-10年','10年以上']

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        icon={<BiBriefcase className="text-2xl" />}
        title="猎聘"
        subtitle="配置猎聘平台的求职参数"
        iconClass="text-white"
        accentBgClass="bg-orange-500"
        actions={
          <div className="flex items-center gap-2">
            {checkingLogin ? (
              <Button size="sm" disabled className="rounded-full bg-gray-300 text-gray-600 px-4"><BiPlay className="mr-1" />检查中...</Button>
            ) : isLoggedIn ? (
              <>
                {isDelivering ? (
                  <Button size="sm" onClick={handleStopDelivery} className="rounded-full bg-red-500 text-white px-4"><BiStop className="mr-1" />停止</Button>
                ) : (
                  <Button size="sm" onClick={handleStartDelivery} className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-4"><BiPlay className="mr-1" />开始投递</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setShowLogoutDialog(true)} className="rounded-full text-red-500"><BiLogOut className="mr-1" />退出</Button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">{backendAvailable ? '请扫码登录' : '后端未连接'}</span>
            )}
          </div>
        }
      />
      <Tabs defaultValue="config">
        <TabsList><TabsTrigger value="config">配置</TabsTrigger><TabsTrigger value="analytics">岗位分析</TabsTrigger></TabsList>
        <TabsContent value="config" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>基本配置</CardTitle>
              <CardDescription><Button onClick={handleSave} className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white"><BiSave /> 保存配置</Button></CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>调试模式</Label>
                  <Select value={String(config.debugger ?? 0)} onChange={(e) => setConfig({ ...config, debugger: Number(e.target.value) })}>
                    <option value="0">关闭</option><option value="1">开启（仅浏览不投递）</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>投递间隔（秒）</Label>
                  <Input type="number" min="0" max="300" value={config.waitTime ?? ''}
                    onChange={(e) => setConfig({ ...config, waitTime: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="例如 5" className="rounded-full" />
                  <p className="text-xs text-muted-foreground">每批投递后的等待秒数，0或留空不等待</p>
                </div>
                <div className="space-y-2">
                  <Label>搜索关键词</Label>
                  <Input value={config.keywords || ''} onChange={(e) => setConfig({ ...config, keywords: e.target.value })} placeholder="例如 Java, 后端" className="rounded-full" />
                </div>
                <div className="space-y-2">
                  <Label>工作城市</Label>
                  <Select value={config.city || ''} onChange={(e) => setConfig({ ...config, city: e.target.value })}>
                    <option value="">不限</option>
                    {(options.city || []).map((c) => (<option key={c.code} value={c.code}>{c.name}</option>))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>薪资范围</Label>
                  <Select value={config.salaryCode || ''} onChange={(e) => setConfig({ ...config, salaryCode: e.target.value })}>
                    {salaryOptions.map(s => (<option key={s} value={s === '不限' ? '' : s}>{s}</option>))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>学历要求</Label>
                  <Select value={config.degree || ''} onChange={(e) => setConfig({ ...config, degree: e.target.value })}>
                    {degreeOptions.map(d => (<option key={d} value={d === '不限' ? '' : d}>{d}</option>))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>工作经验</Label>
                  <Select value={config.experience || ''} onChange={(e) => setConfig({ ...config, experience: e.target.value })}>
                    {expOptions.map(ex => (<option key={ex} value={ex === '不限' ? '' : ex}>{ex}</option>))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>HR活跃过滤</Label>
                  <Select value={String(config.filterDeadHr ?? 0)} onChange={(e) => setConfig({ ...config, filterDeadHr: Number(e.target.value) })}>
                    <option value="0">关闭</option><option value="1">开启</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BiSearch className="text-primary" />黑名单管理 ({blacklist.length}条)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Select value={blacklistType} onChange={(e) => setBlacklistType(e.target.value)} className="w-32">
                  <option value="company">公司</option><option value="job">岗位</option>
                </Select>
                <Input value={newBlacklistKeyword} onChange={(e) => setNewBlacklistKeyword(e.target.value)} placeholder="输入关键词" onKeyDown={(e) => { if (e.key === 'Enter') handleAddBlacklist() }} />
                <Button onClick={handleAddBlacklist} className="whitespace-nowrap"><BiPlus />添加</Button>
              </div>
              <div className="space-y-2">
                {blacklist.length === 0 ? <p className="text-center py-4 text-muted-foreground text-xs">暂无</p> :
                  blacklist.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                      <span className="text-sm"><span className="text-xs text-muted-foreground mr-2">[{item.type === 'company' ? '公司' : '岗位'}]</span>{item.value}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteBlacklist(item.id)} className="text-red-500"><BiTrash /></Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-6 mt-6"><AnalysisContent /></TabsContent>
      </Tabs>
      {/* Dialogs */}
      {showSaveDialog && saveResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"><div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[92%] max-w-sm border p-6"><h3 className="text-lg font-semibold mb-2">{saveResult.success ? '保存成功' : '保存失败'}</h3><p className="text-sm text-muted-foreground mb-4">{saveResult.message}</p><Button onClick={() => setShowSaveDialog(false)} className="w-full rounded-full">知道了</Button></div></div>
      )}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"><div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[92%] max-w-sm border p-6"><h3 className="text-lg font-semibold mb-2">确认退出</h3><p className="text-sm text-muted-foreground mb-4">退出后将清除Cookie。</p><div className="flex gap-2 justify-end"><Button variant="ghost" onClick={() => setShowLogoutDialog(false)}>取消</Button><Button onClick={async () => { await triggerLogout(); setShowLogoutDialog(false) }} className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full">确认退出</Button></div></div></div>
      )}
      {showLogoutResultDialog && logoutResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"><div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[92%] max-w-sm border p-6"><h3 className="text-lg font-semibold mb-2">{logoutResult.success ? '退出成功' : '退出失败'}</h3><p className="text-sm text-muted-foreground mb-4">{logoutResult.message}</p><Button onClick={() => setShowLogoutResultDialog(false)} className="w-full rounded-full">知道了</Button></div></div>
      )}
    </div>
  )
}
