import {log, sys} from '@jovijovi/pedrojs-common';
import {loader} from '@jovijovi/pedrojs-loader';
import {customConfig} from '../config';
import {crawler} from '../crawler';
import {ModuleCrawler} from './id';

// Crawler loader
const crawlerLoader = () => {
	crawler.Run().catch((err) => {
		log.RequestId().fatal(err);
		sys.Shutdown();
	});
}

// Load module by config
export function Load() {
	customConfig.GetCrawler().enable ? loader.Load(ModuleCrawler, crawlerLoader) : false;
}
