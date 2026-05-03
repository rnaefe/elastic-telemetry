"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { searchLogs } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { ArrowLeft, Calendar, Server, User, Database } from "lucide-react"
import { useAuth } from "@/lib/useAuth"

const categoryColors = {
  player: "bg-blue-500",
  inventory: "bg-green-500",
  txadmin: "bg-purple-500",
  resource: "bg-yellow-500",
  chat: "bg-pink-500",
  test: "bg-gray-500",
}

export default function LogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const { currentServer } = useAuth()

  useEffect(() => {
    async function fetchLog() {
      try {
        // Backend'de ID'ye göre tek log çekme endpoint'i olmadığı için
        // geçici olarak arama yapıp ID ile eşleştiriyoruz
        const data = await searchLogs({ limit: 1000, server_id: currentServer?.identifier })
        const foundLog = data.items?.find(item => item._id === params.id)
        setLog(foundLog || null)
      } catch (error) {
        console.error('Log yüklenemedi:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLog()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48 bg-zinc-800/50" />
          <Skeleton className="h-96 bg-zinc-800/50" />
        </div>
      </DashboardLayout>
    )
  }

  if (!log) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => router.back()} className="hover:bg-zinc-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <p className="text-center text-zinc-500">Log not found</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const source = log._source

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="hover:bg-zinc-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">{source.event_type}</h2>
            <p className="text-zinc-400 mt-1">Log Details</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5 text-blue-400" />
                General Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-zinc-500">Time</p>
                <p className="text-sm text-zinc-300 mt-1">{formatDate(source['@timestamp'])}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Category</p>
                <Badge 
                  className="mt-1"
                  style={{ backgroundColor: categoryColors[source.category] }}
                >
                  {source.category}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Event Type</p>
                <p className="text-sm font-mono text-zinc-300 mt-1">{source.event_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Log ID</p>
                <p className="text-xs font-mono text-zinc-500 mt-1">{log._id}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Server className="h-5 w-5 text-purple-400" />
                Server Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-zinc-500">Server Name</p>
                <p className="text-sm text-zinc-300 mt-1">{source.server?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Server ID</p>
                <p className="text-sm text-zinc-300 mt-1">{source.server?.id || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Environment</p>
                <Badge variant={source.isDevServer ? "destructive" : "default"} className="mt-1">
                  {source.isDevServer ? 'Development' : 'Production'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {source.player && (
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5 text-emerald-400" />
                Player Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-zinc-500">Name</p>
                  <p className="text-sm text-zinc-300 mt-1">{source.player.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">ID</p>
                  <p className="text-sm text-zinc-300 mt-1">{source.player.id}</p>
                </div>
              </div>
              {source.player.identifiers && (
                <div>
                  <p className="text-sm font-medium text-zinc-500 mb-2">Identifiers</p>
                  <div className="space-y-1">
                    {Object.entries(source.player.identifiers).map(([key, value]) => (
                      value && (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400">{key}</Badge>
                          <code className="text-xs text-zinc-400">{value}</code>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Database className="h-5 w-5 text-amber-400" />
              Payload
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Additional log-specific data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-black/50 border border-zinc-800 p-4 rounded-lg overflow-x-auto text-xs text-zinc-300">
              {JSON.stringify(source.payload, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Raw JSON</CardTitle>
            <CardDescription className="text-zinc-400">
              Raw data from ClickHouse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-black/50 border border-zinc-800 p-4 rounded-lg overflow-x-auto text-xs text-zinc-300">
              {JSON.stringify(source, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

