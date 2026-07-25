package com.getjobs.application.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("zhilian_config")
public class ZhilianConfigEntity {
    @TableId(type = IdType.AUTO)
    private Long id;
    /** 调试模式：1=开启，0=关闭 */
    private Integer debugger;
    /** 投递间隔（秒） */
    private Integer waitTime;
    /** 搜索关键词（逗号或括号列表，例如 "[Java,后端]" 或 "Java,后端"） */
    private String keywords;
    /** 城市（中文名称或代码，单值） */
    private String cityCode;
    /** 薪资范围（中文名称或代码，单值） */
    private String salary;
    /** 学历要求（中文名称或代码，单值） */
    private String degree;
    /** 工作经验（中文名称或代码，单值） */
    private String experience;
    /** 公司性质：不限/国企/外企/合资/民营/上市公司/事业单位 */
    private String companyType;

    /** 是否过滤不活跃HR（1=启用，0=关闭） */
    private Integer filterDeadHr;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 更新时间 */
    private LocalDateTime updatedAt;
}
