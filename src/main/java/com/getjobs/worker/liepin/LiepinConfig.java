package com.getjobs.worker.liepin;

import lombok.Data;

import java.util.List;

/**
 * @author loks666
 * 项目链接: <a href="https://github.com/loks666/get_jobs">https://github.com/loks666/get_jobs</a>
 */
@Data
public class LiepinConfig {
    /**
     * 搜索关键词列表
     */
    private List<String> keywords;

    /**
     * 城市编码
     */
    private String cityCode;

    /**
     * 薪资范围
     */
    private String salary;
    /** 调试模式 */
    private Boolean debugger;
    /** 投递间隔（秒） */
    private String waitTime;
    /** 学历要求 */
    private String degree;
    /** 工作经验 */
    private String experience;
    /** 是否过滤不活跃HR */
    private Boolean filterDeadHR;

}
