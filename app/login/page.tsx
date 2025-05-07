import FormLogin from "@/components/form-login"
import DebugAuth from "@/components/debug-auth"

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
          <FormLogin />
        </div>
      </div>

      <div className="w-full max-w-lg">
        <DebugAuth />
      </div>
    </div>
  )
}
