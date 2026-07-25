package com.getjobs.application.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("liepin_config")
public class LiepinConfigEntity {
    @TableId(type = IdType.AUTO)
    /** 主键ID */
    private Long id;

    /** 搜索关键词 */
    private String keywords;

    /** 城市（名称或代码） */
    private String city;

    /** 薪资代码或范围 */
    private String salaryCode;
    /** 调试模式：1=开启，0=关闭 */
    private Integer debugger;
    /** 投递间隔（秒） */
    private Integer waitTime;
    /** 学历要求 */
    private String degree;
    /** 工作经验 */
    private String experience;
    /** 是否过滤不活跃HR（1=启用，0=关闭） */
    private Integer filterDeadHr;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}
