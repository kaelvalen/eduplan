import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function CoursesListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-3 space-y-2">
            <div className="flex justify-between items-start">
              <Skeleton className="h-4 w-16" /> {/* Code */}
              <Skeleton className="h-5 w-12 rounded-full" /> {/* Badge */}
            </div>
            <Skeleton className="h-6 w-3/4" /> {/* Name */}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/2" /> {/* Teacher */}
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" /> {/* Category */}
                <Skeleton className="h-5 w-16 rounded-full" /> {/* ECTS */}
              </div>
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-9 flex-1" /> {/* Edit Button */}
                <Skeleton className="h-9 w-9" /> {/* Delete Button */}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function CoursesTableSkeleton() {
  return (
    <div className="rounded-md border p-4">
      <div className="space-y-4">
         <div className="flex justify-between">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-8 w-[100px]" />
         </div>
         {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
               <Skeleton className="h-6 w-[250px]" />
               <Skeleton className="h-6 w-[50px]" />
               <Skeleton className="h-6 w-[50px]" />
               <Skeleton className="h-8 w-[100px]" />
            </div>
         ))}
      </div>
    </div>
  )
}
