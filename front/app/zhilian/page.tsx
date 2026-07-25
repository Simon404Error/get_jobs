'use client'

import { useState, useEffect } from 'react'
import { createSSEWithBackoff } from '@/lib/sse'
import { BiLogOut, BiSave, BiBriefcase, BiPlay, BiStop, BiSearch, BiTrash, BiPlus, BiBuilding } from 'react-icons/bi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AnalysisContent from '@/app/zhilian/analysis/AnalysisContent'
import PageHeader from '@/app/components/PageHeader'

interface ZhilianConfig {
  id?: number
  debugger?: number
  waitTime?: number
  keywords?: string
  cityCode?: string
  salary?: string
  degree?: string
  experience?: string
  filterDeadHr?: number
}

interface Option { id?: number; name: string; code: string }
interface ZhilianOptions { city: Option[] }

interface BlacklistItem { id: number; value: string; type: string }

export default function ZhilianPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isDelivering, setIsDelivering] = useState(false)
  const [checkingLogin, setCheckingLogin] = useState(true)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showLogoutResultDialog, setShowLogoutResultDialog] = useState(false)
  const [logoutResult, setLogoutResult] = useState<{ success: boolean; message: string } | null>(null)
  const [backendAvailable, setBackendAvailable] = useState(true)

  const [config, setConfig] = useState<ZhilianConfig>({
    keywords: '', cityCode: '', salary: '', degree: '', experience: '',
    filterDeadHr: 0,
  })
  const [options, setOptions] = useState<ZhilianOptions>({ city: [] })
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([])
  const [newBlacklistKeyword, setNewBlacklistKeyword] = useState('')
  const [blacklistType, setBlacklistType] = useState('company')

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      setCheckingLogin(false)
      return
    }

    const client = createSSEWithBackoff('http://localhost:8888/api/jobs/login-status/stream', {
      onOpen: () => console.log('[智联 SSE] 已连接'),
      onError: (e, attempt, delay) => {
        setCheckingLogin(false)
      },
      listeners: [
        {
          name: 'connected',
          handler: (event) => {
            try {
              const data = JSON.parse(event.data)
              setIsLoggedIn(data.zhilianLoggedIn || false)
              setCheckingLogin(false)
            } catch (error) {}
          },
        },
        {
          name: 'login-status',
          handler: (event) => {
            try {
              const data = JSON.parse(event.data)
              if (data.platform === 'zhilian') {
                setIsLoggedIn(data.isLoggedIn)
                setCheckingLogin(false)
              }
            } catch (error) {}
          },
        },
        { name: 'ping', handler: () => {} },
      ],
    })

    return () => { client.close() }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('http://localhost:8888/api/zhilian/config')
      const data = await res.json()
      if (data.config) {
        setConfig(prev => ({ ...prev, ...data.config }))
      }
      if (data.options) setOptions(data.options)
      if (data.blacklist) setBlacklist(data.blacklist)
    } catch (e) {
      console.error('获取配置失败:', e)
      setBackendAvailable(false)
    } finally {
      setLoadingConfig(false)
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch('http://localhost:8888/api/zhilian/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        try { await fetch('http://localhost:8888/api/cookie/save?platform=zhilian', { method: 'POST' }) } catch (e) {}
        setSaveResult({ success: true, message: '保存成功' })
        setShowSaveDialog(true)
        fetchConfig()
      } else {
        setSaveResult({ success: false, message: '保存失败' })
        setShowSaveDialog(true)
      }
    } catch (e) {
      setSaveResult({ success: false, message: '网络异常' })
      setShowSaveDialog(true)
    }
  }

  const handleAddBlacklist = async () => {
    if (!newBlacklistKeyword.trim()) return
    try {
      await fetch('http://localhost:8888/api/zhilian/config/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newBlacklistKeyword, type: blacklistType }),
      })
      setNewBlacklistKeyword('')
      fetchConfig()
    } catch (e) {}
  }

  const handleDeleteBlacklist = async (id: number) => {
    try {
      await fetch(`http://localhost:8888/api/zhilian/config/blacklist/${id}`, { method: 'DELETE' })
      fetchConfig()
    } catch (e) {}
  }

  const handleStartDelivery = async () => {
    try { setIsDelivering(true); await fetch('http://localhost:8888/api/zhilian/start', { method: 'POST' }) }
    catch (e) { setIsDelivering(false) }
  }

  const handleStopDelivery = async () => {
    try { await fetch('http://localhost:8888/api/zhilian/stop', { method: 'POST' }); setIsDelivering(false) }
    catch (e) { setIsDelivering(false) }
  }

  const triggerLogout = async () => {
    try {
      const res = await fetch('http://localhost:8888/api/zhilian/logout', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setIsLoggedIn(false); setIsDelivering(false)
        setLogoutResult({ success: true, message: '已退出登录' })
      } else {
        setLogoutResult({ success: false, message: data.message || '退出失败' })
      }
    } catch (e) {
      setLogoutResult({ success: false, message: '网络异常' })
    }
    setShowLogoutResultDialog(true)
  }

  if (loadingConfig) return <div className="flex items-center justify-center h-screen">加载中...</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        icon={<BiBriefcase className="text-2xl" />}
        title="智联招聘"
        subtitle="配置智联招聘平台的求职参数"
        iconClass="text-white"
        accentBgClass="bg-blue-500"
        actions={
          <div className="flex items-center gap-2">
            {checkingLogin ? (
              <Button size="sm" disabled className="rounded-full bg-gray-300 text-gray-600 cursor-not-allowed px-4 shadow">
                <BiPlay className="mr-1" /> 检查登录中...
              </Button>
            ) : isLoggedIn ? (
              <>
                {isDelivering ? (
                  <Button size="sm" onClick={handleStopDelivery} className="rounded-full bg-red-500 hover:bg-red-600 text-white px-4 shadow">
                    <BiStop className="mr-1" /> 停止投递
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleStartDelivery} className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 shadow">
                    <BiPlay className="mr-1" /> 开始投递
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setShowLogoutDialog(true)} className="rounded-full text-red-500 hover:bg-red-50 px-3">
                  <BiLogOut className="mr-1" /> 退出
                </Button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">{backendAvailable ? '请扫码登录' : '后端未连接'}</span>
            )}
          </div>
        }
      />

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config">配置</TabsTrigger>
          <TabsTrigger value="analytics">岗位分析</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6 mt-6">
          {/* 基本配置 */}
          <Card>
            <CardHeader>
              <CardTitle>基本配置</CardTitle>
              <CardDescription>
                <Button onClick={handleSave} className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                  <BiSave /> 保存配置
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>调试模式</Label>
                  <Select value={String(config.debugger ?? 0)} onChange={(e) => setConfig({ ...config, debugger: Number(e.target.value) })}>
                    <option value="0">关闭</option>
                    <option value="1">开启（仅浏览不投递）</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>投递间隔（秒）</Label>
                  <Input type="number" min="0" max="300" value={config.waitTime ?? ''}
                    onChange={(e) => setConfig({ ...config, waitTime: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="例如 5" className="rounded-full" />
                  <p className="text-xs text-muted-foreground">每个岗位投递后的等待秒数，0 或留空表示不等待</p>
                </div>
                <div className="space-y-2">
                  <Label>搜索关键词</Label>
                  <Input value={config.keywords || ''} onChange={(e) => setConfig({ ...config, keywords: e.target.value })}
                    placeholder="例如 Java, 后端" className="rounded-full" />
                </div>
                <div className="space-y-2">
                  <Label>工作城市</Label>
                  <Select value={config.cityCode || ''} onChange={(e) => setConfig({ ...config, cityCode: e.target.value })}>
                    <option value="">不限</option>
                    {(options.city || []).map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>薪资范围</Label>
                  <Select value={config.salary || '0'} onChange={(e) => setConfig({ ...config, salary: e.target.value })}>
                    <option value="0">不限</option>
                    <option value="3k-5k">3k-5k</option>
                    <option value="5k-10k">5k-10k</option>
                    <option value="10k-15k">10k-15k</option>
                    <option value="15k-20k">15k-20k</option>
                    <option value="20k-30k">20k-30k</option>
                    <option value="30k-50k">30k-50k</option>
                    <option value="50k+">50k以上</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>学历要求</Label>
                  <Select value={config.degree || ''} onChange={(e) => setConfig({ ...config, degree: e.target.value })}>
                    <option value="">不限</option>
                    <option value="大专">大专</option>
                    <option value="本科">本科</option>
                    <option value="硕士">硕士</option>
                    <option value="博士">博士</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>工作经验</Label>
                  <Select value={config.experience || ''} onChange={(e) => setConfig({ ...config, experience: e.target.value })}>
                    <option value="">不限</option>
                    <option value="应届">应届</option>
                    <option value="1-3年">1-3年</option>
                    <option value="3-5年">3-5年</option>
                    <option value="5-10年">5-10年</option>
                    <option value="10年以上">10年以上</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>HR活跃过滤</Label>
                  <Select value={String(config.filterDeadHr ?? 0)} onChange={(e) => setConfig({ ...config, filterDeadHr: Number(e.target.value) })}>
                    <option value="0">关闭</option>
                    <option value="1">开启</option>
                  </Select>
                  <p className="text-xs text-muted-foreground">开启后将过滤不活跃的HR</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 黑名单 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BiSearch className="text-primary" /> 黑名单管理 ({blacklist.length} 条)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Select value={blacklistType} onChange={(e) => setBlacklistType(e.target.value)} className="w-32">
                  <option value="company">公司</option>
                  <option value="job">岗位</option>
                </Select>
                <Input value={newBlacklistKeyword} onChange={(e) => setNewBlacklistKeyword(e.target.value)}
                  placeholder="输入关键词" onKeyDown={(e) => { if (e.key === 'Enter') handleAddBlacklist() }} />
                <Button onClick={handleAddBlacklist} className="whitespace-nowrap"><BiPlus /> 添加</Button>
              </div>
              <div className="space-y-2">
                {blacklist.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground text-xs">暂无黑名单</p>
                ) : (
                  blacklist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                      <span className="text-sm">
                        <span className="text-xs text-muted-foreground mr-2">[{item.type === 'company' ? '公司' : '岗位'}]</span>
                        {item.value}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteBlacklist(item.id)}
                        className="text-red-500 hover:text-red-700"><BiTrash /></Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <AnalysisContent />
        </TabsContent>
      </Tabs>

      {/* 保存结果弹框 */}
      {showSaveDialog && saveResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[92%] max-w-sm border p-6">
            <h3 className="text-lg font-semibold mb-2">{saveResult.success ? '保存成功' : '保存失败'}</h3>
            <p className="text-sm text-muted-foreground mb-4">{saveResult.message}</p>
            <Button onClick={() => setShowSaveDialog(false)} className="w-full rounded-full">知道了</Button>
          </div>
        </div>
      )}

      {/* 退出确认弹框 */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[92%] max-w-sm border p-6">
            <h3 className="text-lg font-semibold mb-2">确认退出</h3>
            <p className="text-sm text-muted-foreground mb-4">退出后将清除Cookie并切换为未登录状态。</p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowLogoutDialog(false)}>取消</Button>
              <Button onClick={async () => { await triggerLogout(); setShowLogoutDialog(false) }}
                className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full">确认退出</Button>
            </div>
          </div>
        </div>
      )}

      {showLogoutResultDialog && logoutResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[92%] max-w-sm border p-6">
            <h3 className="text-lg font-semibold mb-2">{logoutResult.success ? '退出成功' : '退出失败'}</h3>
            <p className="text-sm text-muted-foreground mb-4">{logoutResult.message}</p>
            <Button onClick={() => setShowLogoutResultDialog(false)} className="w-full rounded-full">知道了</Button>
          </div>
        </div>
      )}
    </div>
  )
}
