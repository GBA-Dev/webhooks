import { Injectable, OnModuleInit } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { NotionService } from 'src/notion/notion.service';

@Injectable()
export class WebhookPollingService implements OnModuleInit {
  
  constructor(private readonly notionService: NotionService) {}
  
  private readonly serviceClassNames = [NotionService.name];
  private intervalId: NodeJS.Timeout;

  async onModuleInit() {
    console.log('WebhookPollingService initialized...');
    this.startPolling();
  }

  startPolling() {
    console.log('Starting polling...');
    this.intervalId = setInterval(() => {
      this.pollForUpdates();
    }, 5000);
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('Polling stopped');
    }
  }

  private async pollForUpdates() {
    console.log('Polling for updates... ' + this.serviceClassNames);
    await lastValueFrom(this.notionService.getNotionDatabase())
  }
}
