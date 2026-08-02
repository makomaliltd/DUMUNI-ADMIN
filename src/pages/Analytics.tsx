import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">数据分析</h1>
        <p className="text-muted-foreground">查看平台数据趋势与统计</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>访问趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
              <p className="text-sm text-muted-foreground">图表区域（即将上线）</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>数据概览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: '今日访问', value: '1,234' },
                { label: '本周访问', value: '8,567' },
                { label: '本月访问', value: '34,210' },
                { label: '转化率', value: '3.2%' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}