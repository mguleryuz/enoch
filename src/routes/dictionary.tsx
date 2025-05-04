import { createFileRoute } from '@tanstack/react-router'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/dictionary')({
  component: Dictionary,
})

function Dictionary() {
  return (
    <div className="min-h-screen bg-background py-6 md:py-10">
      <div className="container px-4 mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Enochian Dictionary
          </h1>
          <p className="text-muted max-w-2xl mx-auto">
            Complete reference of Enochian language terms, symbols, and
            translations
          </p>
        </header>

        <Card className="mb-6 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Enochian Dictionary PDF</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <p className="mb-6 text-center">
              You can view the dictionary in a new tab or download it.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => window.open('/enoch_dictionary.pdf', '_blank')}
                className="min-w-[200px]"
              >
                <FileText className="mr-2 h-4 w-4" />
                View Dictionary
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = '/enoch_dictionary.pdf'
                  link.download = 'enochian_dictionary.pdf'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="min-w-[200px]"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
