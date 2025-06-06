"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppSelector, useAppDispatch } from "../store/hooks"
import { logout, setUser } from "../store/authSlice"
import { useToast } from "@/components/ui/use-toast"
import {
  User,
  Mail,
  Building,
  Shield,
  LogOut,
  Edit,
  Save,
  X,
  Key,
  Activity,
  Settings
} from "lucide-react"

export default function MyPage() {
  const { isLoggedIn, user, loading } = useAppSelector((state) => state.auth)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { toast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    department: user?.department || ""
  })
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, loading, router])

  useEffect(() => {
    if (user) {
      setEditForm({
        full_name: user.full_name || "",
        email: user.email || "",
        department: user.department || ""
      })
    }
  }, [user])

  const handleEditToggle = () => {
    if (isEditing) {
      // 수정 취소 시 원래 값으로 되돌리기
      setEditForm({
        full_name: user?.full_name || "",
        email: user?.email || "",
        department: user?.department || ""
      })
    }
    setIsEditing(!isEditing)
  }

  const handleSave = async () => {
    if (!user) return

    setIsUpdating(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        dispatch(setUser(updatedUser))
        setIsEditing(false)
        toast({
          title: "프로필 업데이트 성공",
          description: "사용자 정보가 성공적으로 업데이트되었습니다.",
        })
      } else {
        throw new Error("업데이트 실패")
      }
    } catch (error) {
      console.error("Update error:", error)
      toast({
        title: "업데이트 실패",
        description: "사용자 정보 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = () => {
    // Redux store에서 로그인 상태 삭제
    dispatch(logout())

    // 로컬 스토리지에서 토큰 삭제
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")

    // 로그아웃 성공 메시지 표시
    toast({
      title: "로그아웃 성공",
      description: "성공적으로 로그아웃되었습니다.",
    })

    // 로그인 페이지로 리다이렉트
    router.push("/login")
  }

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "manager":
        return "bg-blue-100 text-blue-800"
      case "operator":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case "admin":
        return "관리자"
      case "manager":
        return "매니저"
      case "operator":
        return "운영자"
      case "viewer":
        return "뷰어"
      default:
        return "사용자"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">마이페이지</h1>
          <p className="text-gray-600">사용자 정보 및 계정 설정</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">프로필</TabsTrigger>
            <TabsTrigger value="security">보안</TabsTrigger>
            <TabsTrigger value="activity">활동</TabsTrigger>
          </TabsList>

          {/* 프로필 탭 */}
          <TabsContent value="profile">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="" alt={user.username} />
                      <AvatarFallback className="text-lg">
                        {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">{user.full_name || user.username}</CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          <Shield className="h-3 w-3 mr-1" />
                          {getRoleDisplayName(user.role)}
                        </Badge>
                        {user.department && (
                          <Badge variant="outline">
                            <Building className="h-3 w-3 mr-1" />
                            {user.department}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSave}
                          disabled={isUpdating}
                          size="sm"
                        >
                          {isUpdating ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          onClick={handleEditToggle}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleEditToggle} variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 사용자명 */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>사용자명</span>
                    </Label>
                    <Input
                      id="username"
                      value={user.username}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">사용자명은 변경할 수 없습니다.</p>
                  </div>

                  {/* 이름 */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">이름</Label>
                    <Input
                      id="fullName"
                      value={isEditing ? editForm.full_name : user.full_name || ""}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                      placeholder="이름을 입력하세요"
                    />
                  </div>

                  {/* 이메일 */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>이메일</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={isEditing ? editForm.email : user.email || ""}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                      placeholder="이메일을 입력하세요"
                    />
                  </div>

                  {/* 부서 */}
                  <div className="space-y-2">
                    <Label htmlFor="department" className="flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>부서</span>
                    </Label>
                    <Input
                      id="department"
                      value={isEditing ? editForm.department : user.department || ""}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                      placeholder="부서를 입력하세요"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center pt-4">
                  <div className="text-sm text-gray-500">
                    계정 ID: {user.id}
                  </div>
                  <Button onClick={handleLogout} variant="destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 보안 탭 */}
          <TabsContent value="security">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>보안 설정</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    비밀번호 변경 및 기타 보안 설정 기능은 추후 추가될 예정입니다.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 활동 탭 */}
          <TabsContent value="activity">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>최근 활동</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    사용자 활동 로그 및 통계 기능은 추후 추가될 예정입니다.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
