import { createFileRoute } from '@tanstack/react-router'
import { ChevronDown, Info } from 'lucide-react'
import EnochianAlphabet from '../components/EnochianAlphabet'
import EnochianTranslator from '../components/EnochianTranslator'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useIndexStore } from '@/store/indexStore'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const { showInfo, dialogInfo, setShowInfo, setDialogInfo } = useIndexStore()

  // Media query for mobile detection
  const isMobile = useMediaQuery('(max-width: 768px)')

  const handleInfoClick = (title: string, content: string) => {
    if (isMobile) {
      setDialogInfo({
        title,
        content,
        isOpen: true,
      })
    }
  }

  return (
    <div className="min-h-screen bg-background py-6 md:py-10">
      <div className="container px-4 mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Enochian Translator
          </h1>
          <p className="text-muted max-w-2xl mx-auto">
            Translate from English to the ancient angelic language of Enochian,
            as recorded by Dr. John Dee and Edward Kelley in the 16th century
          </p>
        </header>

        <Card className="mb-6 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">About Enochian</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => setShowInfo(!showInfo)}
              >
                {showInfo ? 'Hide' : 'Show'}
                <ChevronDown
                  className={`ml-1 h-4 w-4 transition-transform ${showInfo ? 'rotate-180' : ''}`}
                />
              </Button>
            </div>
            <CardDescription>
              The celestial language of the angels
            </CardDescription>
          </CardHeader>

          {showInfo && (
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                <p>
                  Enochian is a mysterious language reportedly revealed to Dr.
                  John Dee and Edward Kelley during spiritual communications
                  between 1582 and 1589. Named after the biblical figure Enoch,
                  it was purportedly the language used by angels.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                  {isMobile ? (
                    <div
                      className="p-2 bg-accent rounded-md text-center cursor-pointer"
                      onClick={() =>
                        handleInfoClick(
                          'Writing System: 21 letters',
                          'Enochian uses a unique alphabet of 21 characters, each with its own phonetic value and mystical significance. The letters have distinctive shapes often resembling modified Roman or Greek letters.',
                        )
                      }
                    >
                      <strong>Writing System:</strong> 21 letters
                    </div>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-2 bg-accent rounded-md text-center cursor-help">
                            <strong>Writing System:</strong> 21 letters
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Enochian uses a unique alphabet of 21 characters,
                            each with its own phonetic value and mystical
                            significance. The letters have distinctive shapes
                            often resembling modified Roman or Greek letters.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {isMobile ? (
                    <div
                      className="p-2 bg-accent rounded-md text-center cursor-pointer"
                      onClick={() =>
                        handleInfoClick(
                          'Word Order: VSO',
                          "VSO (Verb-Subject-Object) means that in Enochian sentences, the verb typically comes first, followed by the subject and then the object. This differs from English's standard SVO (Subject-Verb-Object) pattern.",
                        )
                      }
                    >
                      <strong>Word Order:</strong> VSO
                    </div>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-2 bg-accent rounded-md text-center cursor-help">
                            <strong>Word Order:</strong> VSO
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            VSO (Verb-Subject-Object) means that in Enochian
                            sentences, the verb typically comes first, followed
                            by the subject and then the object. This differs
                            from English's standard SVO (Subject-Verb-Object)
                            pattern.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {isMobile ? (
                    <div
                      className="p-2 bg-accent rounded-md text-center cursor-pointer"
                      onClick={() =>
                        handleInfoClick(
                          'Structure: Agglutinative',
                          'Agglutinative languages form words by joining morphemes (word elements) together. In Enochian, complex words are created by combining simpler elements, with each element retaining its meaning and form.',
                        )
                      }
                    >
                      <strong>Structure:</strong> Agglutinative
                    </div>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-2 bg-accent rounded-md text-center cursor-help">
                            <strong>Structure:</strong> Agglutinative
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Agglutinative languages form words by joining
                            morphemes (word elements) together. In Enochian,
                            complex words are created by combining simpler
                            elements, with each element retaining its meaning
                            and form.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <Tabs responsive defaultValue="translator" className="mx-auto mb-10">
          <TabsList className="w-full grid grid-cols-2 mb-6 p-1">
            <TabsTrigger value="translator" className="py-3 text-base">
              <Info className="mr-2 h-4 w-4" />
              Translator
            </TabsTrigger>
            <TabsTrigger value="alphabet" className="py-3 text-base">
              <span className="mr-2 font-bold">Aa</span>
              Enochian Alphabet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="translator">
            <EnochianTranslator />
          </TabsContent>

          <TabsContent value="alphabet">
            <EnochianAlphabet />
          </TabsContent>
        </Tabs>

        <footer className="mt-12 text-center text-muted text-sm">
          <p>Based on the Enochian lexicon and root table</p>
          <p className="mt-1">
            <a
              href="https://en.wikipedia.org/wiki/Enochian"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Learn more about Enochian
            </a>
          </p>
        </footer>
      </div>

      {/* Mobile dialog for info tooltips */}
      <Dialog
        open={dialogInfo.isOpen}
        onOpenChange={(open) => setDialogInfo({ ...dialogInfo, isOpen: open })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogInfo.title}</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <p>{dialogInfo.content}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
